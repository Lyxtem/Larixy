// SPDX-License-Identifier: AGPL-3.0-or-later

use clap::Parser;
use larixy_common::config::EnvMap;
use larixy_media_proxy::{cli, run};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main(flavor = "multi_thread")]
async fn main() -> anyhow::Result<()> {
    let args = cli::Args::parse();
    let env = EnvMap::from_process()?;
    if matches!(args.command, Some(cli::Command::Healthcheck)) {
        return larixy_common::healthcheck::run(larixy_common::healthcheck::address(
            &env,
            "LARIXY_MEDIA_PROXY_HOST",
            "LARIXY_MEDIA_PROXY_PORT",
            8080,
        )?)
        .await;
    }

    tracing_subscriber::registry()
        .with(env.tracing_filter("info"))
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    let cfg = cli::load_config(&args)?;
    run(cfg).await
}
