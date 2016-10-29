wget --output-document=myfile.txt --header "Cookie: beaker.session.id=160e7a46fa0145f7a66ccf23c5c7a131" http://tools.pcic.uvic.ca/dataportal/bc_prism/data/tmax_monClim_PRISM_historical_run1_197101-200012.nc

As csv
wget --output-document=- --header "Cookie: beaker.session.id=160e7a46fa0145f7a66ccf23c5c7a131" http://tools.pcic.uvic.ca/dataportal/bc_prism/data/tmax_monClim_PRISM_historical_run1_197101-200012.nc.csv

so to get the yearly values (13th timestep)
wget --output-document=- --header "Cookie: beaker.session.id=160e7a46fa0145f7a66ccf23c5c7a131" http://tools.pcic.uvic.ca/dataportal/bc_prism/data/tmax_monClim_PRISM_historical_run1_197101-200012.nc.csv?tmax[13][0:16800][0:32410]  2> /dev/null

# Get all the tmax data
# get the key after you've logged in to main site on Chrome
wget --output-document=pr.nc --header "Cookie: beaker.session.id=362b4e247c2d49c48a6ea237e72331ad" http://tools.pcic.uvic.ca/dataportal/bc_prism/data/pr_monClim_PRISM_historical_run1_197101-200012.nc?pr[0:13][0:16800][0:32410]  2> /dev/null


#projection needs to be $EPSG:4269 - NAD83 
# need to transfer data to linux machine for this part

#convert to Geotiff and select band (band represents month number)
gdal_translate -of GTiff NETCDF:"/Users/mathewbrown/projects/PCIC/pc.nc":pc -b 1 /Users/mathewbrown/projects/PCIC/build/jan_pr.tif



