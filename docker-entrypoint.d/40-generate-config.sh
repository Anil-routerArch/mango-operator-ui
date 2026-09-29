#!/bin/sh

ENV_CONFIG_PATH="${ENV_CONFIG_PATH:-/usr/share/nginx/html/env-config.js}"

# Recreate config file
mkdir -p "$(dirname "$ENV_CONFIG_PATH")"
rm -f "$ENV_CONFIG_PATH"
touch "$ENV_CONFIG_PATH"

# Add assignment
echo "window._env_ = {" > "$ENV_CONFIG_PATH"

# Read each line in environment variables
env | grep -E "^(VITE_|REACT_)" | while IFS='=' read -r varname varvalue; do
  [ -z "$varname" ] && continue
  eval "value=\"\${$varname}\""
  [ -z "$value" ] && value="$varvalue"

  # Append configuration property to JS file
  echo "  $varname: \"$value\"," >> "$ENV_CONFIG_PATH"
done

echo "};" >> "$ENV_CONFIG_PATH"
