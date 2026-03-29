#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/setup_ai_env.sh            # install tools + local key checks
#   ./scripts/setup_ai_env.sh --check    # only key checks
#   ./scripts/setup_ai_env.sh --install  # only install tools

MODE="all"
if [[ "${1:-}" == "--check" ]]; then
  MODE="check"
elif [[ "${1:-}" == "--install" ]]; then
  MODE="install"
fi

check_key() {
  local name="$1"
  local prefix="$2"
  local value="${!name:-}"

  if [[ -z "$value" ]]; then
    printf "[MISSING] %s\n" "$name"
    return 0
  fi

  local masked="${value:0:6}...${value: -4}"
  if [[ -n "$prefix" && "$value" != "$prefix"* ]]; then
    printf "[PRESENT] %s (unexpected prefix) => %s\n" "$name" "$masked"
  else
    printf "[PRESENT] %s => %s\n" "$name" "$masked"
  fi
}

run_checks() {
  echo "== AI API key checks (local format only) =="
  check_key "TERRAFORM_API_TOKEN" "atlasv1."
  check_key "TF_API_TOKEN" ""
  check_key "TF_WORKSPACE_ID" "ws-"
  check_key "XAI_API_KEY" "xai-"
  check_key "OPENAI_API_KEY" "sk-"
  check_key "ANTHROPIC_API_KEY" "sk-ant-"
  check_key "GEMINI_API_KEY" "AIza"
  check_key "GOOGLE_API_KEY" ""
  check_key "GROQ_API_KEY" "gsk_"
  check_key "TERRA_API_KEY" ""
  check_key "TERRA_DEV_API_KEY" ""
  check_key "TOGETHER_API_KEY" ""
  check_key "MISTRAL_API_KEY" ""
  check_key "COHERE_API_KEY" ""
  check_key "HUGGINGFACEHUB_API_TOKEN" "hf_"
  check_key "JSONBIN_MASTER_KEY" ""
  check_key "RAILWAY_API_TOKEN" ""
  check_key "LINEAR_API_KEY" "lin_api_"
  check_key "VERCEL_TOKEN" ""
  check_key "CLOUDFLARE_API_TOKEN" "cfat_"
  check_key "CLOUDFLARE_ACCOUNT_ID" ""
  check_key "CLOUDFLARE_ZONE_ID" ""
  check_key "SUPABASE_ANON_KEY" "eyJ"
  check_key "FIREBASE_API_KEY" "AIza"
  check_key "META_APP_ID" ""
  check_key "META_APP_SECRET" ""
  check_key "WEBHOOK_API_KEY" ""
}

install_tools() {
  echo "== Installing AI CLI tooling =="
  python3 -m pip install --upgrade pip
  python3 -m pip install --upgrade \
    aider-chat \
    llm \
    openai \
    anthropic \
    google-generativeai \
    tiktoken

  echo "== Installed versions =="
  python3 -m pip show aider-chat llm openai anthropic google-generativeai tiktoken | rg '^(Name|Version):' || true
}

if [[ "$MODE" == "all" || "$MODE" == "install" ]]; then
  install_tools
fi

if [[ "$MODE" == "all" || "$MODE" == "check" ]]; then
  run_checks
fi
