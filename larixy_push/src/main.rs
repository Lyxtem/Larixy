// SPDX-License-Identifier: AGPL-3.0-or-later

use clap::Parser;
use larixy_common::config::EnvMap;
use larixy_push::{cli, run};

#[tokio::main(flavor = "multi_thread")]
async fn main() -> anyhow::Result<()> {
    let args = cli::Args::parse();
    let env = EnvMap::from_process()?;
    if matches!(args.command, Some(cli::Command::Healthcheck)) {
        return larixy_common::healthcheck::run(larixy_common::healthcheck::address(
            &env,
            "LARIXY_PUSH_SERVICE_HOST",
            "LARIXY_PUSH_SERVICE_PORT",
            args.mode.default_port(),
        )?)
        .await;
    }

    larixy_svc::init_tracing(&env);

    let cfg = cli::load_config(&args, &env)?;
    run(cfg, larixy_common::shutdown::signal_token()).await
}
