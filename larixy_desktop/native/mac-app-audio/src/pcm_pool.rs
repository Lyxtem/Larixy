// SPDX-License-Identifier: AGPL-3.0-or-later

pub use larixy_sample_pool::PCM_SLOT_SAMPLES_MAX;
pub type PcmFramePool = larixy_sample_pool::SamplePool<f32, true>;
pub type PooledPcmFrame = larixy_sample_pool::PooledSamples<f32, true>;
pub const PCM_POOL_CAP: usize = 16;
