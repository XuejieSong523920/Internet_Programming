#!/usr/bin/env python3
# See https://docs.python.org/3.2/library/socket.html
# for a decscription of python socket and its parameters
import socket
import os
import stat
import sys
import urllib.parse
import datetime

from threading import Thread
from argparse import ArgumentParser

BUFSIZE = 4096
PortAssign = 9001
NewPort = input()
if NewPort is not '':
  PortAssign = NewPort

#add the following
CRLF = '\r\n'
METHOD_NOT_ALLOWED = 'HTTP/1.1 405 METHOD NOT ALLOWED{}{}Allow: GET, HEAD, POST {}'.format(CRLF, CRLF, CRLF)
OK = 'HTTP/1.1 200 OK{}{}'.format(CRLF, CRLF)
NOT_FOUND = 'HTTP/1.1 404 NOT FOUND{}{}'.format(CRLF, CRLF)
FORBIDDEN = 'HTTP/1.1 403 FORBIDDEN{}{}'.format(CRLF, CRLF)

def get_contents(fname):
    with open(fname, 'rb') as f:
        return f.read()

def check_perms(resource):
    # Returns True if resource has read permissions set on 'others'
    stmode = os.stat(resource).st_mode
    return (getattr(stat, 'S_IROTH') & stmode) > 0

class MyServer:
  def __init__(self, host, port):
    print('listening on port {}'.format(port))
    self.host = host
    self.port = port
    self.setup_socket()
    self.accept()
    self.sock.shutdown()
    self.sock.close()

  def setup_socket(self):
    self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    self.sock.bind((self.host, self.port))
    self.sock.listen(128)

  def accept(self):
    while True:
      (client, address) = self.sock.accept()
      th = Thread(target=self.accept_request, args=(client, address))
      th.start()

  # here, we add a function belonging to the class to accept
  # and process a request
  def accept_request(self, client_sock, client_addr):
      data = client_sock.recv(BUFSIZE)
      req = data.decode('utf-8') #returns a string
      response = self.process_request(req) #returns a string
      #once we get a response, we chop it into utf encoded bytes
      #and send it (like EchoClient)
      client_sock.send(response)

      #clean up the connection to the client
      #but leave the server socket for recieving requests open
      client_sock.shutdown(1)
      client_sock.close()
  def process_request(self, request):
    print('######\nREQUEST:\n{}######'.format(request))
    linelist = request.strip().split(CRLF)
    reqline = linelist[0]
    rlwords = reqline.split()
    if len(rlwords) == 0:
        return ''
    if rlwords[0] == 'HEAD':  
        resource = rlwords[1][1:] # skip beginning /
        return self.head_request(resource)
    if rlwords[0] == 'GET':  
        resource = rlwords[1][1:]
        res =  self.get_request(resource)
        return res
    if rlwords[0] == 'POST':  
        postContent = linelist[-1]
        #print('post = {}'.format(postContent))
        return self.post_request(postContent)
    else: #add ELIF checks for GET and POST before this else..
        return self.method_notal()
    
  def method_notal(self):
    ret = bytes(METHOD_NOT_ALLOWED,'utf-8')
    return ret

  def head_request(self, resource):
    """Handles HEAD requests."""
    path = os.path.join('.', resource) #look in directory where server is running
    if not os.path.exists(resource):
      ret = NOT_FOUND
    elif not check_perms(resource):
      ret = FORBIDDEN
    else:
      ret = OK
    ret = bytes(ret,'utf-8')
    return ret
#to do a get request, read resource contents and append to ret value.
#(you should check types of accept lines before doing so)
# You figure out the rest

  def get_request(self, resource):
    """Handles GET requests."""
    types = ['html', 'jpg', 'png', 'mp3', 'js', 'css']
    path = os.path.join('.', resource) #look in directory where server is running
    if not os.path.exists(resource):
      display = get_contents("404.html")
      ret = bytes(NOT_FOUND,'utf-8') + display
    elif not check_perms(resource):
      display = get_contents("403.html")
      ret = bytes(FORBIDDEN,'utf-8') + display
    else:
      req = resource.split(".")
      print('type = {}'.format(req[1]))
      print('the all name of the file = {}'.format(resource))
      if req[1] in types:
        display = get_contents(resource)
        ret = bytes(OK,'utf-8')  + display
      else:
        display = "'.{}' file is not supported".format(req[1])
        ret = bytes(display, 'utf-8')
    return ret

  def post_request(self, postCont):
    postC = postCont.replace("%3A", ":")
    postC = postC.replace("%2F", "/")
    postC = postC.replace("+", " ")
    postC = postC.replace("%2C", ",")
    postCs = postC.split("&")
    content = 'HTTP/1.x 200 ok\r\nContent-Type: text/html\r\n\r\n'
    table = ''
    table += '<table style="border:2px solid black;width:50%;font-size:20px;font-weight:bold">'
    for i in range(len(postCs)):
      curItem = postCs[i]
      curIts = curItem.split("=")
      table += '<tr><td style="border:2px solid black;width:20%;height:40px">'
      table += curIts[0]
      table += '</td><td style="border:2px solid black;width:30%;height:40px">'
      table += curIts[1]
      table += '</td></tr>'
    table += '</table>'
    content += table
    cont = bytes(content,'utf-8')
    return cont


def parse_args(Port):
  parser = ArgumentParser()
  parser.add_argument('--host', type=str, default='localhost',
                      help='specify a host to operate on (default: localhost)')
  parser.add_argument('-p', '--port', type=int, default=Port,
                      help='specify a port to operate on (default: 9001)')
  args = parser.parse_args()
  return (args.host, args.port)

if __name__ == '__main__':
  (host, port) = parse_args(PortAssign)
  MyServer(host, port)
