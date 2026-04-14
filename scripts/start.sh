#!/bin/bash
(podman compose up -d) &
(cd backend && uv run manage.py runserver) &
(cd frontend && bun run dev)
