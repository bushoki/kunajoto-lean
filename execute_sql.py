import json
import subprocess
import os

PROJECT_ID = "grnekxrkypgighmxyveh"
SQL_FILE = "Kunajoto-fire-/supabase_vibe_logic.sql"

def execute_sql_file(file_path):
    print(f"Attempting to execute SQL from {file_path}...")
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        payload = {
            "project_id": PROJECT_ID,
            "query": content
        }
        
        command = [
            "manus-mcp-cli",
            "tool",
            "call",
            "execute_sql",
            "--server",
            "supabase",
            "--input",
            json.dumps(payload)
        ]
        
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        print(f"SQL execution successful.")
        print(result.stdout)
        print(result.stderr)

    except subprocess.CalledProcessError as e:
        print(f"SQL execution failed with error: {e}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
    except Exception as e:
        print(f"An unexpected error occurred during SQL execution: {e}")

if __name__ == "__main__":
    execute_sql_file(SQL_FILE)
