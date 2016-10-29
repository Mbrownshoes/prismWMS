#This is a demo of the BC Climate Explorere, build for PCIC



# Nginx setup
nginx sites-enabled - worked on fantec site

# include includes/upstreams/*;

server {
  listen 80;
  server_name prism.noip.me;

root /home/mathew/projects/prismWMS/prismWMS/;
  
  index index.html index.htm index.php;

location /ncWMS/ {
 proxy_pass     http://tools.pacificclimate.org/ncWMS-PCIC/;
 proxy_set_header       X-Real-IP $remote_addr;
}
location /geoserver/ {
 proxy_pass      http://tools.pacificclimate.org/geoserver/;
}

location /toolsPCIC/ {
 proxy_pass     http://tools.pacificclimate.org/;
}
}