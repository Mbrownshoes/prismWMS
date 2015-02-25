build/gpr_000b11a_e.zip:
	mkdir -p $(dir $@)
	curl -o $@ http://www12.statcan.gc.ca/census-recensement/2011/geo/bound-limit/files-fichiers/$(notdir $@)

build/gpr_000b11a_e.shp: build/gpr_000b11a_e.zip
	unzip -od $(dir $@) $<
	touch $@

# build/canada.shp: build/gpr_000b11a_e.shp
# 	ogr2ogr -t_srs "+proj=aea +lat_1=20 +lat_2=60 +lat_0=40 +lon_0=-96 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs " \
# 	build/canada.shp \
# 	build/gpr_000b11a_e.shp
# this is for PCICwms
build/canada.json: build/gpr_000b11a_e.shp
	ogr2ogr -f GeoJSON -t_srs "+proj=latlong +datum=WGS84" \
	build/canada.json \
	build/gpr_000b11a_e.shp


canada.json: build/canada.json
	node_modules/.bin/topojson \
		-o $@ \
		-s 1e-8 \
		--properties='province=PRENAME' \
		-- $<
# build/BC.json: build/gpr_000b11a_e.shp
# 	ogr2ogr -f GeoJSON \
# 	-t_srs "+proj=aea +lat_1=20 +lat_2=60 +lat_0=40 +lon_0=-96 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs " \
# 	build/BC.json \
# 	build/gpr_000b11a_e.shp

# prov.json: build/canada.shp
# 	node_modules/.bin/topojson \
# 		-o $@ \
# 	    --properties='province=PRENAME' \
# 		--simplify=0.5 \
# 		-- prov=$<


newUs.json: build/us.json
	node_modules/.bin/topojson \
		-o $@ \
		--projection='width = 960, height = 600, d3.geo.albers() \
			.rotate([96, 0]) \
		    .center([-32, 53.9]) \
		    .parallels([20, 60]) \
		    .scale(1970) \
		    .translate([width / 2, height / 2])' \
		--simplify=0.5 \
	    -- newUs=$<




build/tempCol.tiff: build/jan.tif
	gdaldem \
	color-relief \
	  build/jan.tif \
	  color_temp.txt \
	  build/tempCol.tiff

build/final.tiff: build/tempCol.tiff
	gdalwarp \
	  -r lanczos \
	  -ts 960 0 \
	  -t_srs EPSG:4326 \
	  build/tempCol.tiff \
	  build/final.tiff

build/relief.tiff: build/final.tiff
	gdalwarp \
	  -r lanczos \
	  -ts 960 600 \
	  -t_srs "+proj=aea +lat_1=50 +lat_2=58.5 +lat_0=45 +lon_0=-126 +x_0=1000000 +y_0=0 +ellps=GRS80 +datum=NAD83 +units=m +no_defs" \
	  build/final.tiff \
	  build/relief.tiff


band1.png: build/relief.tiff
	gdal_translate -of PNG build/relief.tiff band1.png

# set correct projection on 'raw' tif, then add to geoserver

us.json: us-states.json
	node_modules/.bin/topojson \
		-o $@ \
		--properties \
		--projection='width = 960, height = 600, d3.geo.albers() \
			.rotate([96, 0]) \
		    .center([-32, 53.9]) \
		    .parallels([20, 60]) \
		    .scale(1970) \
		    .translate([width / 2, height / 2])' \
		--simplify=0.5 \
	    -- us=$<

# build/finalWms.tiff: build/testWms.tif
# 	gdalwarp \
# 	  -r lanczos \
# 	  -t_srs EPSG:3857 \
# 	  build/testWms.tif \
# 	  build/finalWms.tiff

# build/reliefWms.tiff: build/finalWms.tiff
# 	gdalwarp \
# 	  -r lanczos \
# 	  -ts 960 0 \
# 	  -t_srs "+proj=aea +lat_1=20 +lat_2=60 +lat_0=40 +lon_0=-96 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs " \
#   -te -2950000 1000000 -1000000 2950000 \
# 	  build/finalWms.tiff \
# 	  build/reliefWms.tiff
