.PHONY: run

run:
	uv run uvicorn vidmirror.main:app --reload
