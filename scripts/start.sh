#!/bin/bash
(podman compose up -d) &
(cd backend && uv run manage.py serve) &
(cd frontend && bun run dev)
