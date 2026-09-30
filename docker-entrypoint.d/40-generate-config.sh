#!/bin/sh

ENV_CONFIG_PATH="${ENV_CONFIG_PATH:-/usr/share/nginx/html/env-config.js}"

# Recreate config file
mkdir -p "$(dirname "$ENV_CONFIG_PATH")"
rm -f "$ENV_CONFIG_PATH"
touch "$ENV_CONFIG_PATH"

# Write opening assignment
echo "window._env_ = {" > "$ENV_CONFIG_PATH"

# Safely extract and JSON-escape all VITE_ and REACT_ environment variables
awk 'BEGIN {
  for (k in ENVIRON) {
    if (k ~ /^(VITE_|REACT_)/) {
      val = ENVIRON[k]
      gsub(/\\/, "\\\\", val)
      gsub(/"/, "\\\"", val)
      gsub(/\r/, "\\r", val)
      gsub(/\n/, "\\n", val)
      gsub(/\t/, "\\t", val)
      printf "  \"%s\": \"%s\",\n", k, val
    }
  }
}' | sort >> "$ENV_CONFIG_PATH"

# Close assignment
echo "};" >> "$ENV_CONFIG_PATH"
