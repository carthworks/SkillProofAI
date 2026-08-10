# Sandbox Runner

This folder contains the execution sandbox design for the TalentForge POC.

## Purpose

- isolated Docker-based runners for code execution
- separate container templates for CSE and ECE
- enforce resource limits and disable network access

## Next steps

- add Dockerfiles for code execution containers
- implement Node.js worker service in `backend` to dispatch to sandbox jobs
- build test harness for sample submissions
