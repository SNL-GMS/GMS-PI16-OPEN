{{/*
Render the docker image tag, truncated to 62 characters to match Gitlab's $CI_COMMIT_REF_SLUG.
Usage:
    {{ include "ldap-proxy.baseDomain" . }}
*/}}
{{- define "ldap-proxy.baseDomain" -}}
  {{- if hasKey .Values "global" -}}
    {{ .Values.global.baseDomain }}
  {{- else -}}
    {{ .Values.baseDomain }}
  {{- end -}}
{{- end -}}

{{/*
Render the docker image tag, truncated to 62 characters to match Gitlab's $CI_COMMIT_REF_SLUG.
Usage:
    {{ include "ldap-proxy.imageTag" . }}
*/}}
{{- define "ldap-proxy.imageTag" -}}
{{ .Values.imageTag | trunc 62 }}
{{- end -}}

{{/*
Render the full docker image path.
Usage:
    image: {{ include "ldap-proxy.container.image" (dict "Values" .Values "appValues" $appValues) }}
Or:
    image: {{ include "ldap-proxy.container.image" (dict "Values" .Values "appValues" (dict "imageName" "gms-common/centos")) }}
*/}}
{{- define "ldap-proxy.container.image" -}}
  {{- if contains ":" .appValues.imageName -}}
    {{ printf "%s/%s" .Values.imageRegistry .appValues.imageName | quote }}
  {{- else -}}
    {{ printf "%s/%s:%s" .Values.imageRegistry .appValues.imageName (include "ldap-proxy.imageTag" .) | quote }}
  {{- end -}}
{{- end -}}

{{/*
Render the app environment variables for a app's container by combining the
top-level `env` and the app's `env` from values.yaml (per-app envs take
precedence), and expanding templates in the resulting values.  A special
`.appName` is added to the context in the template expansion so that an app's
`env` can use `.appName` to refer to its own name.
Usage:
          env: {{- include "ldap-proxy.app.deployment.env" (dict "appName" $appName "appEnv" $appValues.env "globalEnv" .Values.env "context" $) }}
*/}}
{{- define "ldap-proxy.app.deployment.env" -}}
  {{- $mergedEnv := merge dict (.appEnv | default dict) (.globalEnv | default dict) -}}
  {{- if $mergedEnv -}}
    {{- range $key, $val := $mergedEnv }}
            - name: {{ $key | quote }}
              value: {{ tpl ($val | toString) (merge (dict "appName" $.appName) $.context) | quote }}
    {{- end }}
  {{- end -}}
{{- end -}}

