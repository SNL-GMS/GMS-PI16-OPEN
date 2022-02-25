#! /bin/bash
set -eu
export GMS_UI_MODE=${GMS_UI_MODE:-soh} #Default the variable to soh if it is not set

if [ "$GMS_UI_MODE" = "ian" ]; then
  cat /etc/nginx/nginx-ian.template | envsubst '$URL_PATH $GMS_UI_MODE'  > /etc/nginx/nginx.conf
else
  cat /etc/nginx/nginx-soh-all.template | envsubst '$URL_PATH $GMS_UI_MODE' > /etc/nginx/nginx.conf
fi

exec nginx -g 'daemon off;'
