{{/*
Compile all Values errors into a single message and call fail.
*/}}
{{- define "logging.validateValues" -}}
{{- $messages := list -}}
{{- $messages := eq .Release.Name "default"                                           | ternary "- The instance name cannot be 'default'." "" | append $messages -}}
{{- $messages := ne .Release.Name .Release.Namespace                                  | ternary (printf "- The instance name (%s) and the namespace name (%s) must match (e.g., '--namespace %s --create-namespace')." .Release.Name .Release.Namespace .Release.Name) "" | append $messages -}}
{{- $messages := empty .Values.global.baseDomain                                      | ternary "- global.baseDomain value must be provided specifying the base name for hostname-based Ingress routing (e.g., '--set global.baseDomain=cluster.example.com')." "" | append $messages -}}
{{- $messages := index .Values "ldap-proxy" "imageRegistry"                   | empty | ternary "- ldap-proxy.imageRegistry value must be provided specifying the image registry for the ldap-proxy image (e.g., '--set ldap-proxy.imageRegistry=docker-registry')." "" | append $messages -}}
{{- $messages := index .Values "ldap-proxy" "imageName"                       | empty | ternary "- ldap-proxy.imageName value must be provided specifying the image name for the ldap-proxy image (e.g., '--set ldap-proxy.imageName=gms-common/ldap-proxy')." "" | append $messages -}}
{{- $messages := index .Values "ldap-proxy" "imageTag"                        | empty | ternary "- ldap-proxy.imageTag value must be provided specifying the image tag for the ldap-proxy image (e.g., '--set ldap-proxy.imageTag=my-tag')." "" | append $messages -}}
{{- $messages := index .Values "ldap-proxy" "baseDomain"                      | empty | ternary "- ldap-proxy.baseDomain value must be provided specifying the base name for the hostname-based Ingress routing (e.g., '--set ldap-proxy.baseDomain=cluster.example.com')." "" | append $messages -}}
{{- $messages := empty .Values.elasticsearch.image                                    | ternary "- elasticsearch.image value must be provided specifying the image name for the elasticsearch image (e.g., '--set elasticsearch.image=docker-registry/gms-common/logging-elasticsearch')." "" | append $messages -}}
{{- $messages := empty .Values.elasticsearch.imageTag                                 | ternary "- elasticsearch.imageTag value must be provided specifying the image tag for the elasticsearch image (e.g., '--set elasticsearch.imageTag=my-tag')." "" | append $messages -}}
{{- $messages := index .Values "fluent-bit" "imageRegistry"                   | empty | ternary "- fluent-bit.imageRegistry value must be provided specifying the image registry for the fluent-bit image (e.g., '--set fluent-bit.imageRegistry=docker-registry')." "" | append $messages -}}
{{- $messages := index .Values "fluent-bit" "image" "repository"              | empty | ternary "- fluent-bit.image.repository value must be provided specifying the image registry + image name for the fluent-bit image (e.g., '--set fluent-bit.image.repository=docker-registry/gms-common/logging-fluent-bit')." "" | append $messages -}}
{{- $messages := index .Values "fluent-bit" "image" "tag"                     | empty | ternary "- fluent-bit.image.tag value must be provided specifying the image tag for the fluent-bit image (e.g., '--set fluent-bit.image.tag=my-tag')." "" | append $messages -}}
{{- $messages := index .Values "fluent-bit" "testFramework" "image" "repository" | empty | ternary "- fluent-bit.testFramework.image.repository value must be provided specifying the image registry + image name for the fluent-bit testFramework image (e.g., '--set fluent-bit.testFramework.image.repository=docker-registry/gms-common/logging-busybox')." "" | append $messages -}}
{{- $messages := index .Values "fluent-bit" "testFramework" "image" "tag"     | empty | ternary "- fluent-bit.testFramework.image.tag value must be provided specifying the image tag for the fluent-bit testFramework image (e.g., '--set fluent-bit.testFramework.image.tag=my-tag')." "" | append $messages -}}
{{- $messages := empty .Values.kibana.image                                           | ternary "- kibana.image value must be provided specifying the image name for the kibana image (e.g., '--set kibana.image=docker-registry/gms-common/logging-kibana')." "" | append $messages -}}
{{- $messages := empty .Values.kibana.imageTag                                        | ternary "- kibana.imageTag value must be provided specifying the image tag for the kibana image (e.g., '--set kibana.imageTag=my-tag')." "" | append $messages -}}
{{- $messages := empty .Values.imageTag                                               | ternary "- imageTag value must be provided specifying the image tag for the overall logging stack (e.g., '--set imageTag=my-tag')." "" | append $messages -}}
{{- $messages := without $messages "" -}}
{{- if $messages -}}
  {{- printf "\nVALUES VALIDATION ERRORS:\n%s" (join "\n" $messages) | fail -}}
{{- end -}}
{{- end -}}
