// SPDX-License-Identifier: AGPL-3.0-or-later

use larixy_common::config::EnvMap;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let env = EnvMap::from_process()?;
    larixy_svc::init_tracing(&env);
    let config = larixy_unfurl::Config::from_env(&env)?;
    larixy_unfurl::run(config, larixy_common::shutdown::signal_token()).await
}
