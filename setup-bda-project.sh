#create blueprint
blueprint_name="driving-license-blueprint3"
bda_schema=$(cat driving-license-blueprint-sample.json)
blueprint_response=$(/usr/local/bin/aws bedrock-data-automation create-blueprint \
--blueprint-name "$blueprint_name" \
--type "DOCUMENT" \
--schema "$bda_schema")
blueprint_arn=$(echo "$blueprint_response" | jq -r '.blueprint.blueprintArn')
blueprint_stage=$(echo "$blueprint_response" | jq -r '.blueprint.blueprintStage')

#create bda project
bda_project_name="bda-project2"
standardoutputconfig=$(cat bda-standard-output-sample.json)
customoutputconfig='{
  "blueprints":[
    {
      "blueprintArn":"'$blueprint_arn'",
      "blueprintStage":"'$blueprint_stage'"
    }
  ]
}
'

bda_response=$(/usr/local/bin/aws bedrock-data-automation create-data-automation-project \
--project-name "$bda_project_name" \
--standard-output-configuration "$standardoutputconfig" \
--custom-output-configuration "$customoutputconfig")
bda_project_arn=$(echo "$bda_response" | jq -r '.projectArn')

# Save environment variable
echo 'export BDA_PROJECT_ARN="'$bda_project_arn'"' >> ~/.bashrc
echo "BDA project created: $bda_project_arn"

source ~/.bashrc