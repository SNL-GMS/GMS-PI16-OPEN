{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "grafana.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "grafana.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "grafana.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the name of the service account
*/}}
{{- define "grafana.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
    {{ default (include "grafana.fullname" .) .Values.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{- define "grafana.serviceAccountNameTest" -}}
{{- if .Values.serviceAccount.create -}}
    {{ default (print (include "grafana.fullname" .) "-test") .Values.serviceAccount.nameTest }}
{{- else -}}
    {{ default "default" .Values.serviceAccount.nameTest }}
{{- end -}}
{{- end -}}

{{/*
Allow the release namespace to be overridden for multi-namespace deployments in combined charts
*/}}
{{- define "grafana.namespace" -}}
  {{- if .Values.namespaceOverride -}}
    {{- .Values.namespaceOverride -}}
  {{- else -}}
    {{- .Release.Namespace -}}
  {{- end -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "grafana.labels" -}}
helm.sh/chart: {{ include "grafana.chart" . }}
{{ include "grafana.selectorLabels" . }}
{{- if or .Chart.AppVersion .Values.image.tag }}
app.kubernetes.io/version: {{ .Values.image.tag | default .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "grafana.selectorLabels" -}}
app.kubernetes.io/name: {{ include "grafana.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "grafana.imageRenderer.labels" -}}
helm.sh/chart: {{ include "grafana.chart" . }}
{{ include "grafana.imageRenderer.selectorLabels" . }}
{{- if or .Chart.AppVersion .Values.image.tag }}
app.kubernetes.io/version: {{ .Values.image.tag | default .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels ImageRenderer
*/}}
{{- define "grafana.imageRenderer.selectorLabels" -}}
app.kubernetes.io/name: {{ include "grafana.name" . }}-image-renderer
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Return the appropriate apiVersion for rbac.
*/}}
{{- define "rbac.apiVersion" -}}
{{- if .Capabilities.APIVersions.Has "rbac.authorization.k8s.io/v1" }}
{{- print "rbac.authorization.k8s.io/v1" -}}
{{- else -}}
{{- print "rbac.authorization.k8s.io/v1beta1" -}}
{{- end -}}
{{- end -}}

{{/*
Compile all Values errors into a single message and call fail.
*/}}
{{- define "grafana.validateValues" -}}
{{- $messages := list -}}
{{- $messages := eq .Release.Name "default"                                           | ternary "- The instance name cannot be 'default'." "" | append $messages -}}
{{- $messages := ne .Release.Name .Release.Namespace                                  | ternary (printf "- The instance name (%s) and the namespace name (%s) must match (e.g., '--namespace %s --create-namespace')." .Release.Name .Release.Namespace .Release.Name) "" | append $messages -}}
{{- $messages := empty .Values.baseDomain                                             | ternary "- baseDomain value must be provided specifying the base name for hostname-based Ingress routing (e.g., '--set baseDomain=cluster.example.com')." "" | append $messages -}}
{{- $messages := empty .Values.image.repository                                       | ternary "- image.repository value must be provided specifying the image name for the grafana image (e.g., '--set image.repository=docker-registry/gms-common/monitoring-grafana')." "" | append $messages -}}
{{- $messages := empty .Values.image.tag                                              | ternary "- image.tag value must be provided specifying the image tag for the grafana image (e.g., '--set image.tag=my-tag')." "" | append $messages -}}
{{- $messages := empty .Values.initChownData.image.repository                          | ternary "- initChownData.image.repository value must be provided specifying the image name for the busybox image (e.g., '--set initChownData.image.repository=docker-registry/gms-common/monitoring-busybox')." "" | append $messages -}}
{{- $messages := empty .Values.initChownData.image.tag                                 | ternary "- initChownData.image.tag value must be provided specifying the image tag for the busybox image (e.g., '--set initChownData.image.tag=my-tag')." "" | append $messages -}}
{{- $messages := without $messages "" -}}
{{- if $messages -}}
  {{- printf "\nVALUES VALIDATION ERRORS:\n%s" (join "\n" $messages) | fail -}}
{{- end -}}
{{- end -}}

