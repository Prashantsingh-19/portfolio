# Prashant AI OS

## What it is
Prashant AI OS is a personal AI agent orchestration system — a set of agents designed to run continuously on Prashant's own machine and handle recurring, mundane tasks on his behalf, rather than a single chatbot. It's positioned specifically toward PM roles, since it's as much a product/orchestration exercise as a technical one.

## How it's built
- Code: https://github.com/Prashantsingh-19/prashant-ai-os
- It's a separate project from the currency-risk / GJR-GARCH work.
- The flagship agent, **ARES**, retrieves structured information on request via a Telegram message — instead of Prashant manually searching and piecing things together himself. ARES currently acts as the prototype proving out how the full multi-agent system would perform.
- Other agents were proposed to extend the system — **MINERVA, HERMES, MENTOR, AEGIS** — each meant to ease a different category of recurring task or help him prepare for specific cases. Expansion to these was paused due to hardware limitations.
- Testing is currently happening over Telegram; the plan is to later move the connection host to Discord.
- A dashboard is planned to visualize how each agent is performing, since the system is meant to run continuously in the background rather than being invoked one-off.

## Why it matters (for a recruiter)
Prashant AI OS shows product-orchestration thinking: designing a *system* of specialized agents around his own real workflow needs, prioritizing what to build first (ARES) under real hardware constraints, and planning for observability (the dashboard) before scaling out further agents. It signals PM-track strengths around sequencing, prioritization, and designing for a real (if personal) user — himself.