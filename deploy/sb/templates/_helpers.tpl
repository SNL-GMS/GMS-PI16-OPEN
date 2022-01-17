{{/*
Render the docker image tag, truncated to 62 characters to match Gitlab's $CI_COMMIT_REF_SLUG.
Usage:
    {{ include "sb.imageTag" . }}
*/}}
{{- define "sb.imageTag" -}}
{{ .Values.imageTag | trunc 63 }}
{{- end -}}



{{/*
Render the full docker image path.
Usage:
    image: {{ include "sb.container.image" (dict "Values" .Values "appValues" $appValues) }}
Or:
    image: {{ include "sb.container.image" (dict "Values" .Values "appValues" (dict "imageName" "gms-common/centos")) }}
*/}}
{{- define "sb.container.image" -}}
  {{- if contains ":" .appValues.imageName -}}
    {{ printf "%s/%s" .Values.imageRegistry .appValues.imageName | quote }}
  {{- else -}}
    {{ printf "%s/%s:%s" .Values.imageRegistry .appValues.imageName (include "sb.imageTag" .) | quote }}
  {{- end -}}
{{- end -}}



{{/*
Render the app environment variables for a app's container by combining the
top-level `env` and the app's `env` from values.yaml (per-app envs take
precedence), and expanding templates in the resulting values.  A special
`.appName` is added to the context in the template expansion so that an app's
`env` can use `.appName` to refer to its own name.
Usage:
          env: {{- include "sb.app.deployment.env" (dict "appName" $appName "appEnv" $appValues.env "globalEnv" .Values.env "context" $) }}
*/}}
{{- define "sb.app.deployment.env" -}}
  {{- $mergedEnv := merge dict (.appEnv | default dict) (.globalEnv | default dict) -}}
  {{- if $mergedEnv -}}
    {{- range $key, $val := $mergedEnv }}
            - name: {{ $key | quote }}
              value: {{ tpl ($val | toString) (merge (dict "appName" $.appName) $.context) | quote }}
    {{- end }}
  {{- end -}}
{{- end -}}



{{/*
Render the app's Deployment strategy type.
Usage:
    strategy:
      type: {{ include "sb.deployment.strategy" (dict "Values" .Values "appValues" $appValues) }}
*/}}
{{- define "sb.deployment.strategy" -}}
{{ .appValues.deploymentStrategy | default "RollingUpdate" }}
{{- end -}}



{{/*
Render the app's restartAfterReconfig value.
Usage:
    labels:
      restartAfterReconfig: {{ include "sb.deployment.restartAfterReconfig" (dict "Values" .Values "appValues" $appValues) }}
*/}}
{{- define "sb.deployment.restartAfterReconfig" -}}
{{ .appValues.restartAfterReconfig | default "false" | quote }}
{{- end -}}



{{/*
Render the initContainer to wait for config load.
Usage:
    initContainers:
      {{- include "sb.container.initContainer.wait-for-config-load" (dict "Values" .Values "appValues" $appValues) | nindent 8 }}
*/}}
{{- define "sb.container.initContainer.wait-for-config-load" -}}
- name: wait-for-config-load
  image: {{ include "sb.container.image" (dict "Values" .Values "appValues" (dict "imageName" "gms-common/centos")) }}
  imagePullPolicy: Always
  command: ["/bin/bash", "-c"]
  args: ["url=http://config-loader:8080/config-loader/initialized; while true; do echo Curling ${url}; http_code=$(curl -s -o /dev/null -I -w \"%{http_code}\" --insecure --max-time 1 ${url}); echo Returned http_code: ${http_code}; if [[ ${http_code} == \"200\" ]]; then break; fi; sleep 1s; done;"]
{{- end -}}



{{/*
Render the container's resources requests and limits.
      containers:
        - name: "appname"
          image: "docker-image-name:tag"
          {{- include "sb.container.resources" (dict "Values" .Values "appValues" $appValues) | nindent 10 }}
*/}}
{{- define "sb.container.resources" -}}
{{- if or (and .appValues.cpu_request .appValues.cpu_limit) (and .appValues.memory_request .appValues.memory_limit) -}}
resources:
  requests:
    {{- if (.appValues.cpu_request)}}
    cpu: {{ .appValues.cpu_request }}
    {{- end }}
    {{- if (.appValues.memory_request)}}
    memory: {{ .appValues.memory_request }}
    {{- end }}
  limits:
    {{- if (.appValues.cpu_limit)}}
    cpu: {{ .appValues.cpu_limit }}
    {{- end }}
    {{- if (.appValues.memory_limit)}}
    memory: {{ .appValues.memory_limit }}
    {{- end }}
{{- end }}
{{- end }}


{{/*
Compile all Values errors into a single message and call fail.
*/}}
{{- define "sb.validateValues" -}}
{{- $messages := list -}}
{{- $messages := empty .Values.imageRegistry                  | ternary "- imageRegistry value must be provided specifying the container image registry (e.g., '--set imageRegistry=docker-registry.example.com')." "" | append $messages -}}
{{- $messages := empty .Values.baseDomain                     | ternary "- baseDomain value must be provided specifying the base name for hostname-based Ingress routing (e.g., '--set baseDomain=cluster.example.com')." "" | append $messages -}}
{{- $messages := empty .Values.password.etcd.gms | ternary "- A password must be provided for the etcd gms user." "" | append $messages -}}
{{- $messages := empty .Values.password.etcd.gmsadmin | ternary "- A password must be provided for the etcd gmsadmin user." "" | append $messages -}}
{{- $messages := empty .Values.password.etcd.root | ternary "- A password must be provided for the etcd root user." "" | append $messages -}}
{{- $messages := empty .Values.password.postgres.gms_super_user | ternary "- A password must be provided for the postgres gms_super_user user." "" | append $messages -}}
{{- $messages := empty .Values.password.postgres.gms_admin | ternary "- A password must be provided for the postgres gms_admin user." "" | append $messages -}}
{{- $messages := empty .Values.password.postgres.gms_read_only | ternary "- A password must be provided for the postgres gms_read_only user." "" | append $messages -}}
{{- $messages := empty .Values.password.postgres.gms_config_application | ternary "- A password must be provided for the postgres gms_config_application user." "" | append $messages -}}
{{- $messages := empty .Values.password.postgres.gms_session_application | ternary "- A password must be provided for the postgres gms_session_application user." "" | append $messages -}}
{{- $messages := empty .Values.password.postgres.gms_soh_application | ternary "- A password must be provided for the postgres gms_soh_application user." "" | append $messages -}}
{{- $messages := empty .Values.password.postgres.gms_soh_test_application | ternary "- A password must be provided for the postgres gms_soh_test_application user." "" | append $messages -}}
{{- $messages := empty .Values.password.postgres.gms_soh_ttl_application | ternary "- A password must be provided for the postgres gms_soh_ttl_application user." "" | append $messages -}}
{{- $messages := eq .Release.Name "default"                   | ternary "- The instance name cannot be 'default'." "" | append $messages -}}
{{- $messages := ne .Release.Name .Release.Namespace          | ternary (printf "- The instance name (%s) and the namespace name (%s) must match (e.g., '--namespace %s --create-namespace')." .Release.Name .Release.Namespace .Release.Name) "" | append $messages -}}
{{- $messages := empty .Values.global.imageRegistry           | ternary "- global.imageRegistry value must be provided specifying the container image registry (e.g., '--set global.imageRegistry=docker-registry.example.com')." "" | append $messages -}}
{{- $messages := empty .Values.global.imageTag                | ternary "- global.imageTag value must be provided specifying the Docker image tag to run (e.g., '--set global.imageTag=develop')." "" | append $messages -}}
{{- $messages := empty .Values.kafka.image.registry           | ternary "- kafka.image.registry value must be provided specifying the container image registry (e.g., '--set kafka.image.registry=docker-registry.example.com')." "" | append $messages -}}
{{- $messages := empty .Values.kafka.image.tag                | ternary "- kafka.image.tag value must be provided specifying the Docker image tag to run (e.g., '--set kafka.image.tag=develop')." "" | append $messages -}}
{{- $messages := empty .Values.kafka.zookeeper.image.registry | ternary "- kafka.zookeeper.image.registry value must be provided specifying the container image registry (e.g., '--set kafka.zookeeper.image.registry=docker-registry.example.com')." "" | append $messages -}}
{{- $messages := empty .Values.kafka.zookeeper.image.tag      | ternary "- kafka.zookeeper.image.tag value must be provided specifying the Docker image tag to run (e.g., '--set kafka.zookeeper.image.tag=develop')." "" | append $messages -}}
{{- $messages := without $messages "" -}}
{{- if $messages -}}
  {{- printf "\nVALUES VALIDATION ERRORS:\n%s" (join "\n" $messages) | fail -}}
{{- end -}}
{{- end -}}
