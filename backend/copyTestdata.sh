rsync -a -v --ignore-existing ../testdata/outputs ../mnt
rsync -a -v --ignore-existing ../testdata/uploads ../mnt

# why not docker cp?