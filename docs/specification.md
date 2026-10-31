# AI Interview Agent 2.0 - Product & Engineering Specification

## Purpose
Build a polished, production-minded, full-stack AI interview practice platform from scratch.
Primary audience: A candidate practising technical interviews and a developer demonstrating Python backend and full-stack skills.
Implementation style: Build in small, verifiable phases. Prioritize a working, tested MVP before advanced infrastructure.

Refer to project documentation and prompt requirements for complete product rules:
- Role presets: Python Developer, Backend Developer, Full-Stack Developer, Data Analyst, Data Scientist, ML Engineer, or Custom.
- Question count: 3 - 10 (default 5).
- Rubric: 0-10 scale (Technical correctness 0-4, Completeness 0-2, Reasoning 0-2, Relevance & clarity 0-2).
- Security: Argon2id password hashing, ownership enforcement on all routes, no secrets leaked.
- AI Model: Gemini API via official `google-genai` SDK.
