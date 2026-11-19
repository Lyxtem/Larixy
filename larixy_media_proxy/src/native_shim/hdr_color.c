// SPDX-License-Identifier: AGPL-3.0-or-later

#include "native_shim_internal.h"

float larixy_pq_lut[LARIXY_HDR_PQ_LUT_SIZE];
float larixy_hlg_lut[LARIXY_HDR_HLG_LUT_SIZE];
float larixy_hlg_ootf_scale_lut[LARIXY_HDR_HLG_LUT_SIZE];
float larixy_pq_tone_scale_lut[LARIXY_HDR_PQ_LUT_SIZE];
float larixy_hlg_tone_scale_lut[LARIXY_HDR_HLG_LUT_SIZE];
uint8_t larixy_srgb_lut[LARIXY_HDR_SRGB_LUT_SIZE];
float larixy_pq_sdr_target_perceptual;
float larixy_hlg_source_peak_perceptual;
float larixy_hlg_sdr_target_perceptual;

static pthread_once_t larixy_hdr_lut_once = PTHREAD_ONCE_INIT;

static void larixy_init_hdr_luts(void) {
    const double m1 = 0.1593017578125;
    const double m2 = 78.84375;
    const double c1 = 0.8359375;
    const double c2 = 18.8515625;
    const double c3 = 18.6875;
    for (int index = 0; index < LARIXY_HDR_PQ_LUT_SIZE; index++) {
        double encoded = (double)index / (LARIXY_HDR_PQ_LUT_SIZE - 1);
        double encoded_power = pow(encoded, 1.0 / m2);
        double numerator = encoded_power - c1;
        if (numerator < 0.0) numerator = 0.0;
        double denominator = c2 - c3 * encoded_power;
        double luminance = denominator > 0.0
                         ? pow(numerator / denominator, 1.0 / m1)
                         : 0.0;
        if (luminance < 0.0) luminance = 0.0;
        if (luminance > 1.0) luminance = 1.0;
        larixy_pq_lut[index] = (float)luminance;
    }
    const double a = 0.17883277;
    const double b = 0.28466892;
    const double c = 0.55991073;
    for (int index = 0; index < LARIXY_HDR_HLG_LUT_SIZE; index++) {
        double encoded = (double)index / (LARIXY_HDR_HLG_LUT_SIZE - 1);
        double scene = encoded <= 0.5
                     ? (encoded * encoded) / 3.0
                     : (exp((encoded - c) / a) + b) / 12.0;
        if (scene < 0.0) scene = 0.0;
        if (scene > 1.0) scene = 1.0;
        larixy_hlg_lut[index] = (float)scene;
        double normalized = (double)index / (LARIXY_HDR_HLG_LUT_SIZE - 1);
        larixy_hlg_ootf_scale_lut[index] = normalized > 0.0
                                         ? (float)pow(normalized, 0.2)
                                         : 0.0f;
    }
    larixy_pq_sdr_target_perceptual =
        larixy_pq_oetf(LARIXY_PQ_SDR_TARGET_NORM);
    larixy_hlg_source_peak_perceptual =
        larixy_pq_oetf(LARIXY_HLG_REFERENCE_PEAK_NORM);
    larixy_hlg_sdr_target_perceptual =
        larixy_pq_sdr_target_perceptual /
        larixy_hlg_source_peak_perceptual;
    for (int index = 0; index < LARIXY_HDR_PQ_LUT_SIZE; index++) {
        larixy_pq_tone_scale_lut[index] = larixy_hdr_tone_scale(
            larixy_pq_lut[index], LARIXY_PQ_SDR_TARGET_NORM,
            1.0f,
            larixy_pq_sdr_target_perceptual);
    }
    for (int index = 0; index < LARIXY_HDR_HLG_LUT_SIZE; index++) {
        float maximum = (float)index / (LARIXY_HDR_HLG_LUT_SIZE - 1);
        float absolute_maximum =
            maximum * LARIXY_HLG_REFERENCE_PEAK_NORM;
        larixy_hlg_tone_scale_lut[index] =
            LARIXY_HLG_REFERENCE_PEAK_NORM * larixy_hdr_tone_scale(
                absolute_maximum, LARIXY_PQ_SDR_TARGET_NORM,
                larixy_hlg_source_peak_perceptual,
                larixy_hlg_sdr_target_perceptual);
    }
    for (int index = 0; index < LARIXY_HDR_SRGB_LUT_SIZE; index++) {
        float linear = (float)index / (LARIXY_HDR_SRGB_LUT_SIZE - 1);
        larixy_srgb_lut[index] = larixy_quantize8(
            larixy_srgb_oetf(linear));
    }
}

static inline uint16_t larixy_hdr_read_le16(const uint8_t *value) {
    return (uint16_t)((uint16_t)value[0] | ((uint16_t)value[1] << 8));
}

int larixy_hdr_luts_ready(void) {
    if (pthread_once(&larixy_hdr_lut_once, larixy_init_hdr_luts) != 0) {
        return LARIXY_NATIVE_STATUS_CODEC_FAILURE;
    }
    return LARIXY_NATIVE_STATUS_OK;
}

int larixy_hdr_transfer_is_hdr(int transfer) {
    return transfer == LARIXY_HDR_TRANSFER_PQ ||
           transfer == LARIXY_HDR_TRANSFER_HLG;
}

int larixy_hdr_apply_sdr_gamut(
    uint8_t *rgba,
    int width,
    int height,
    int gamut,
    int transfer,
    int deadline_rows,
    long long deadline_monotonic_ms
) {
    if (rgba == NULL || width <= 0 || height <= 0 || deadline_rows <= 0) {
        return LARIXY_NATIVE_STATUS_CODEC_FAILURE;
    }
    if (larixy_hdr_transfer_is_hdr(transfer)) {
        return LARIXY_NATIVE_STATUS_UNSUPPORTED;
    }
    if (transfer != LARIXY_HDR_TRANSFER_SRGB &&
        transfer != LARIXY_HDR_TRANSFER_BT709 &&
        transfer != LARIXY_HDR_TRANSFER_BT2020_12 &&
        transfer != LARIXY_HDR_TRANSFER_LINEAR) {
        return LARIXY_NATIVE_STATUS_UNSUPPORTED;
    }
    if (transfer == LARIXY_HDR_TRANSFER_SRGB &&
        gamut == LARIXY_HDR_GAMUT_SRGB) {
        return LARIXY_NATIVE_STATUS_OK;
    }
    int status = larixy_hdr_luts_ready();
    if (status != LARIXY_NATIVE_STATUS_OK) return status;
    size_t row_bytes = (size_t)width * 4u;
    for (int row = 0; row < height; row++) {
        if (row % deadline_rows == 0) {
            status = larixy_native_deadline_status(deadline_monotonic_ms);
            if (status != LARIXY_NATIVE_STATUS_OK) return status;
        }
        uint8_t *row_data = rgba + (size_t)row * row_bytes;
        for (int column = 0; column < width; column++) {
            uint8_t *pixel = row_data + (size_t)column * 4u;
            float red = (float)pixel[0] / 255.0f;
            float green = (float)pixel[1] / 255.0f;
            float blue = (float)pixel[2] / 255.0f;
            if (transfer == LARIXY_HDR_TRANSFER_SRGB) {
                red = larixy_inverse_srgb(red);
                green = larixy_inverse_srgb(green);
                blue = larixy_inverse_srgb(blue);
            } else if (transfer == LARIXY_HDR_TRANSFER_BT709) {
                red = larixy_inverse_bt709(red);
                green = larixy_inverse_bt709(green);
                blue = larixy_inverse_bt709(blue);
            } else if (transfer == LARIXY_HDR_TRANSFER_BT2020_12) {
                red = larixy_inverse_bt2020_12(red);
                green = larixy_inverse_bt2020_12(green);
                blue = larixy_inverse_bt2020_12(blue);
            }
            float srgb_red = 0.0f;
            float srgb_green = 0.0f;
            float srgb_blue = 0.0f;
            larixy_hdr_convert_gamut_linear(
                gamut, red, green, blue,
                &srgb_red, &srgb_green, &srgb_blue);
            pixel[0] = larixy_quantize8(larixy_srgb_oetf(srgb_red));
            pixel[1] = larixy_quantize8(larixy_srgb_oetf(srgb_green));
            pixel[2] = larixy_quantize8(larixy_srgb_oetf(srgb_blue));
        }
    }
    return larixy_native_deadline_status(deadline_monotonic_ms);
}

int larixy_hdr_tone_map_rgba16(
    const uint8_t *source,
    size_t source_stride,
    uint8_t *destination,
    size_t destination_stride,
    int width,
    int height,
    int bit_depth,
    int gamut,
    int transfer,
    int deadline_rows,
    long long deadline_monotonic_ms
) {
    if (source == NULL || destination == NULL || width <= 0 || height <= 0 ||
        deadline_rows <= 0) {
        return LARIXY_NATIVE_STATUS_CODEC_FAILURE;
    }
    if (bit_depth != 10 && bit_depth != 12 && bit_depth != 16) {
        return LARIXY_NATIVE_STATUS_UNSUPPORTED;
    }
    if (!larixy_hdr_transfer_is_hdr(transfer)) {
        return LARIXY_NATIVE_STATUS_UNSUPPORTED;
    }
    if ((size_t)width > SIZE_MAX / 8u) {
        return LARIXY_NATIVE_STATUS_INVALID_DIMENSIONS;
    }
    if (source_stride < (size_t)width * 8u ||
        destination_stride < (size_t)width * 4u) {
        return LARIXY_NATIVE_STATUS_CODEC_FAILURE;
    }
    int status = larixy_hdr_luts_ready();
    if (status != LARIXY_NATIVE_STATUS_OK) return status;
    int is_hlg = transfer == LARIXY_HDR_TRANSFER_HLG;
    unsigned int mask = bit_depth == 16
                      ? 0xffffu
                      : (unsigned int)((1u << bit_depth) - 1u);
    const float *linear_lut = is_hlg ? larixy_hlg_lut : larixy_pq_lut;
    const float *tone_scale_lut =
        is_hlg ? larixy_hlg_tone_scale_lut : larixy_pq_tone_scale_lut;
    for (int row = 0; row < height; row++) {
        if (row % deadline_rows == 0) {
            status = larixy_native_deadline_status(deadline_monotonic_ms);
            if (status != LARIXY_NATIVE_STATUS_OK) return status;
        }
        const uint8_t *source_row = source + (size_t)row * source_stride;
        uint8_t *destination_row =
            destination + (size_t)row * destination_stride;
        for (int column = 0; column < width; column++) {
            const uint8_t *source_pixel = source_row + (size_t)column * 8u;
            uint16_t red_code =
                (uint16_t)(larixy_hdr_read_le16(source_pixel) & mask);
            uint16_t green_code =
                (uint16_t)(larixy_hdr_read_le16(source_pixel + 2) & mask);
            uint16_t blue_code =
                (uint16_t)(larixy_hdr_read_le16(source_pixel + 4) & mask);
            uint16_t red_index = larixy_hdr_lut_index(red_code, bit_depth);
            uint16_t green_index = larixy_hdr_lut_index(green_code, bit_depth);
            uint16_t blue_index = larixy_hdr_lut_index(blue_code, bit_depth);
            float red = linear_lut[red_index];
            float green = linear_lut[green_index];
            float blue = linear_lut[blue_index];
            uint16_t maximum_index = red_index;
            if (green_index > maximum_index) maximum_index = green_index;
            if (blue_index > maximum_index) maximum_index = blue_index;
            if (is_hlg) {
                float luma = larixy_hdr_linear_luma(gamut, red, green, blue);
                float ootf_scale =
                    larixy_hlg_ootf_scale_lut[larixy_unit_lut_index(luma)];
                red *= ootf_scale;
                green *= ootf_scale;
                blue *= ootf_scale;
                float maximum = fmaxf(red, fmaxf(green, blue));
                maximum_index = larixy_unit_lut_index(maximum);
            }
            float scale = tone_scale_lut[maximum_index];
            uint8_t *destination_pixel =
                destination_row + (size_t)column * 4u;
            larixy_hdr_pipeline_pixel(
                red, green, blue, scale, gamut, destination_pixel);
            unsigned int alpha =
                (unsigned int)larixy_hdr_read_le16(source_pixel + 6) & mask;
            destination_pixel[3] = (uint8_t)(
                (alpha * 255u + (mask >> 1)) / mask);
        }
    }
    return larixy_native_deadline_status(deadline_monotonic_ms);
}
