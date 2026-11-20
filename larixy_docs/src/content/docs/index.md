---
# SPDX-License-Identifier: AGPL-3.0-or-later
title: Larixy Developer Documentation
description: Reference for the Larixy HTTP API, Gateway WebSocket, voice connections, media proxy and bots.
head:
  - tag: title
    content: Larixy Developer Documentation
---

Welcome to the Larixy Developer Documentation. You can build bots, applications, webhooks and integrations with the Larixy HTTP API and Gateway.

| Section | Description |
| --- | --- |
| [HTTP API](/http-api/) | Read and change users, guilds, channels and messages |
| [Gateway](/gateway/overview/) | Receive [events](/gateway/events/) over a WebSocket connection |
| [Voice](/voice/) | Join voice calls and stream audio/video |
| [Media Proxy](/media-proxy/overview/) | Load media and upload files |
| [Downloads](/downloads/overview/) | Download desktop builds |

[Authentication](/authentication/), [Errors](/http-api/errors/), [Rate limits](/topics/rate-limits/) and [Locales](/topics/locales/) describe behavior that the APIs share. Each page says where it differs. Most IDs are [snowflakes](/snowflakes/).

## Field notation

In field tables, `?` after a field name means optional. Before a type, it means nullable.

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | `string` | Required and cannot be `null` |
| `name?` | `string` | Optional, but cannot be `null` when present |
| `name` | `?string` | Required, but can be `null` |
| `name?` | `?string` | Can be omitted or set to `null` |

In a request body, leaving a field out and sending `null` can do different things, and the endpoint says which.

| Type | Meaning |
| --- | --- |
| `array[type]` | An array of that type |
| `map[key, value]` | A JSON object with keys of the first type and values of the second |

## Endpoint discovery

Get `/.well-known/larixy` on the instance origin to find its base URLs. It needs no authentication and allows cross-origin requests.

```text
GET https://example.com/.well-known/larixy
```

Bots, libraries and third-party clients send requests to `endpoints.api_public` from the [endpoints object](/http-api/instance/#instance-endpoints-object) followed by a `/v1` path, such as `/v1/users/@me`. Connect to the Gateway at `endpoints.gateway`. Don't build base URLs from the origin or hard-code Larixy domains. Send credentials in the `Authorization` header as described in [Authentication](/authentication/).
