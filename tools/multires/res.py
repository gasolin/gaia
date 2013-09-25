import os, glob, sys
from string import Template
import datetime

template = """
<DOCTYPE html>
<html>
  <body>
    $table
  </body>
</html>
"""

def run():
	# print sys.argv
	multires = {}
	applist = get_app_list()
	# print applist
	if len(sys.argv) > 1 and sys.argv[1] in applist:
		app = sys.argv[1]
		print 'gathering ' + app + ' resources'
		if (app != shared):
		    root = get_app_res(app)
		    multires[app] = root
		else:
			multires['shared'] = get_shared_res()
    
		html_report(multires, sys.argv[1])
	else:
		for app in applist:
			print 'gathering ' + app + ' resources to check basic syntax error'
			root = get_app_res(app)
			multires[app] = root

			html_report(multires, app)

		multires['shared'] = get_shared_res()
		html_report(multires, 'shared')
		
		table = '<h1>' + 'Gaia Resources ' + datetime.datetime.now().strftime('%d, %b %Y') + '</h1><table >'
		for app in applist:
			table += '<tr>'
			table += '<td><a href="' + app + '.html" target="_blank">' + app + '</a></td>'
			table += '</tr>'
		table += '<tr><td><a href="shared.html" target="_blank">shared</a></td></tr>'
		d = dict(table=table)
		fd = open('index.html', 'w')
		fd.write(Template(template).substitute(d))

# generate web page
def html_report(multires, app):
	current_res = multires[app]
	table = '<h1>' + app + ' ' + datetime.datetime.now().strftime('%d, %b %Y') + '</h1><table >'
	for i in current_res.keys():
		b = current_res[i]
		table += '<tr><td colspan=' + str(len(b)) + ' bgcolor=lightgrey>' + i + '</td></tr>'

		table += '<tr>'
		for i in b.keys():
			table += '<td>' + i + '</td>'

		table += '</tr><tr>'
		for i in b.keys():
			table += '<td><img src="' + b[i] + '"></td>'
		table += '</tr>'

	d = dict(table=table)
	
	fd = open(app+'.html', 'w')
	fd.write(Template(template).substitute(d))

# find all apps
def get_app_list():
    return [
        x.split(os.path.sep)[1:][0] for x in (glob.glob(os.path.join('apps', '*')))
        if not x.endswith('.')]

# find shared resource
def get_shared_res():
	print 'gathering shared resources to check basic syntax error'
	res = []
	root = {}
	for r,d,f in os.walk('shared'):
	    for files in f:
	        if files.endswith(".png") or files.endswith(".jpg"):
	             res_path = os.path.join(r,files);
	             res.append(res_path)
	             if '@' in res_path:
	             	splits = res_path.split('@')
	                tmp = splits[1]
	                key = splits[1].split('x')[0]+'x'
	                tmp_path = splits[0] + tmp.split('x')[1]
	                if tmp_path in root:
	                    root[splits[0] + tmp.split('x')[1]][key] = res_path
	                else:
	                	root[tmp_path] = {'1x':tmp_path}
	             else:
	             	root[res_path] = {'1x':res_path}
	return root

# find all images in x res to a dict
def get_app_res(app, prefix = 'apps'):
	res = []
	root = {}
	for r,d,f in os.walk(os.path.join(prefix, app)):
	    for files in f:
	        if files.endswith(".png") or files.endswith(".jpg"):
	             res_path = os.path.join(r,files);
	             res.append(res_path)
	             if '@' in res_path:
	             	splits = res_path.split('@')
	                tmp = splits[1]
	                key = splits[1].split('x')[0]+'x'
	                tmp_path = splits[0] + tmp.split('x')[1]
	                if tmp_path in root:
	                    root[splits[0] + tmp.split('x')[1]][key] = res_path
	                else:
	                	root[tmp_path] = {'1x':tmp_path}
	             else:
	             	root[res_path] = {'1x':res_path}
	return root

if __name__ == '__main__':
    run()