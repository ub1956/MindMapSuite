<?php
// Configuration file for MindServer/MindWeb/MindView
// @copy 2010 Sebastian Muszytowski
// @author Sebastian Muszytowski <muzy@muzybot.de>
return array(
// These options can increase the page processing
// speed up to three times.
"inlinejavascript"=>"true",
"inlinecss"=>"true",
// Options related to Mindmap Import/Export
//
// mindmap-import can be dangerous and is
// a potential risk of cross-site-scripting.
// Furthermore notice that MindWeb does not
// support all features of Freemind
//
// mindmap-export is riskless and compatible
// with Freemind version 0.8.0 and higher
"enable_import"=>"true",
"enable_export"=>"true",
// Hostname,
// this is used to specify the base tag so that
// the whole system works out. (style: domain.tld)
"hostname"=>"subdomain.domain.tld/mindmap",
// Database related options. You can choose between
// 3 different Database-Management-Systems.
// Available dbms are:
// postgres,sqlite,flatfile
"dbms"=>"flatfile",
// please specify the dsn (data source name) for
// the selected dbms
// Examples:
//
//  postgres
//    pgsql:host=localhost;port=5432;dbname=thedb;user=uname;password=pw
//
//  sqlite
//    sqlite:/path/to/the/sqlitedb.sq3
//
//  flatfile
//    /path/to/the/data/storage/dir/which/is/writeable
"dsn"=>"/var/www/domain.tld/datadir/",
// LDAP Auth
// It is possible to enable user authentication for
// some MindMaps. Please notice that an user creation
// script is not part of this software.
// To protect mindmaps the option "protection" must be
// checked. This auth type requires a valid user.
"ldap_auth_enabled"=>"true",
// LDAP Data
// (each option has to match your LDAP server)
"ldap_server"=>"127.0.0.1",
"ldap_binddn"=>"uid=foo,dc=domain,dc=tld",
"ldap_bindpw"=>"password",
"ldap_base"=>"dc=domain,dc=tld",
// this must return an SSHA password
"ldap_return"=>"userPassword",
// you can use the variable $userinput in your filter
"ldap_filter"="(&(uid=$userinput))",

// unless you set this option to true nothing will work
"configured"=>"false"
)
?>
