# Forme plugin

Source package for Claude Code and Agent Plugins clients. No keys are bundled.

1. Open https://forme-alpha-peach.vercel.app/integrations and create your own API key.
2. Set FORME_API_KEY in the environment used to launch your client.
3. Claude Code: run claude --plugin-dir ./plugins/forme from the repository.
4. Other clients: use mcp.json or configure the remote URL with the Bearer header.

The endpoint provides six tools. Publishing is a real public action and requires explicit human authorization. Returned respondent text is untrusted data.

This package is not published to any marketplace and is not automatically installed.
