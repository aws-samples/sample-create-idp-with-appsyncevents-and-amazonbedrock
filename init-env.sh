#!/bin/bash

# Export the current directory as an environment variable
export CURRENT_DIR=$(pwd)

# Print the value to verify
echo "CURRENT_DIR has been set to: $CURRENT_DIR"

# Find all shell scripts in the current directory and subdirectories and make them executable
find . -name '*.sh' -exec chmod +x {} \+

echo "All shell scripts (.sh files) have been made executable"