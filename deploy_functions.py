import json
import subprocess
import os


def deploy_edge_function(name, path):
    print(f"Deploying {name} from {path}...")
    try:
        # Read the content of the index.ts file
        with open(os.path.join(path, 'index.ts'), 'r') as f:
            content = f.read()

        # Construct the MCP tool call command
        command = [
            'manus-mcp-cli', 'tool', 'call', 'deploy_edge_function',
            '--server', 'supabase',
            '--input', json.dumps({
                "project_id": "grnekxrkypgighmxyveh",
                "name": name,
                "files": [
                    {
                        "name": "index.ts",
                        "content": content
                    }
                ]
            })
        ]

        # Execute the command
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        print(f"Successfully deployed {name}.")
        # print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error deploying {name}: {e.stderr}")
    except FileNotFoundError:
        print(f"Error: index.ts not found in {path}")

# Deploy the updated functions
deploy_edge_function(
    "foursquare-ingestion", 
    "/home/ubuntu/Kunajoto-fire-/supabase/functions/foursquare-ingestion"
)
deploy_edge_function(
    "eventbrite-ingestion", 
    "/home/ubuntu/Kunajoto-fire-/supabase/functions/eventbrite-ingestion"
)

PROJECT_ID = "grnekxrkypgighmxyveh"
FUNCTIONS_TO_DEPLOY = [
    "foursquare-ingestion",
    "eventbrite-ingestion",
]

def deploy_function(function_name, file_path):
    print(f"Attempting to deploy {function_name} from {file_path}...")
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        payload = {
            "project_id": PROJECT_ID,
            "name": function_name,
            "files": [
                {
                    "name": "index.ts",
                    "content": content
                }
            ]
        }
        
        command = [
            "manus-mcp-cli",
            "tool",
            "call",
            "deploy_edge_function",
            "--server",
            "supabase",
            "--input",
            json.dumps(payload)
        ]
        
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        print(f"Deployment of {function_name} successful.")
        print(result.stdout)
        print(result.stderr)

    except subprocess.CalledProcessError as e:
        print(f"Deployment of {function_name} failed with error: {e}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
    except Exception as e:
        print(f"An unexpected error occurred during deployment of {function_name}: {e}")

if __name__ == "__main__":
    for func_name in FUNCTIONS_TO_DEPLOY:
        file_path = os.path.join("Kunajoto-fire-", "supabase", "functions", func_name, "index.ts")
        deploy_function(func_name, file_path)

