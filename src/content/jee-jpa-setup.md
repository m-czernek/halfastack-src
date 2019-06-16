---
layout: post
title: "[JPA Setup] Deploying a Database for JEE Environment"
image: img/article-background.png
author: Marek
date: 2018-04-30T07:03:47.149Z
tags: 
  - JEE
  - "Java EE"
  - "EX183"
  - "Red Hat"
---

The following post shows you:

* Installing and starting a local database (HSQLDB) 
* Creating a datasource in the Wildfly application server

It is a pre-requisite to running the example JPA application that you will be asked to modify, and that will demonstrate in practice JPA theory in the JPA introduction I and II.

# Installing and starting database

For my example, I chose the Hypersonic SQL Database (HSQLDB). It is very easy to install, start, and like most production relational databases, it is exposed on a particular URL, so that multiple applications or users can connect to it. 

To prepare a database instance:

1. Download the latest [HSQLDB](https://sourceforge.net/projects/hsqldb/files/) zip file. At the time of writing, it is *hsqldb-2.4.0.zip*. 
2. Unzip the file into a directory of your choosing. This will be referred to as `${HSQLDB_HOME}`.
3. In a command line, change into the `${HSQLDB_HOME}/hsql/data` directory, for example: `cd c:/hsqldb-2.4.0/hsql/data`
4. Execute the following command: `java -cp ../lib/hsqldb.jar org.hsqldb.Server -database.0 file:bookDbFile -dbname.0 bookDb` The command starts a database with the following parameters:
    1. Database is exposed on localhost:9001
    2. The database is named bookDb. The example application requires bookDb to be present.
    3. The user sa is given admin privileges to the bookDb database

You should see something similar to the following:

```
[Server@7ac7a4e4]: Startup sequence initiated from main() method
[Server@7ac7a4e4]: Could not load properties from file
[Server@7ac7a4e4]: Using cli/default properties only
[Server@7ac7a4e4]: Initiating startup sequence...
[Server@7ac7a4e4]: Server socket opened successfully in 18 ms.
Jun 14, 2019 2:23:23 PM org.hsqldb.persist.Logger logInfoEvent
INFO: Checkpoint start
Jun 14, 2019 2:23:23 PM org.hsqldb.persist.Logger logInfoEvent
INFO: checkpointClose start
Jun 14, 2019 2:23:23 PM org.hsqldb.persist.Logger logInfoEvent
INFO: checkpointClose synched
Jun 14, 2019 2:23:23 PM org.hsqldb.persist.Logger logInfoEvent
INFO: checkpointClose script done
Jun 14, 2019 2:23:23 PM org.hsqldb.persist.Logger logInfoEvent
INFO: checkpointClose end
Jun 14, 2019 2:23:23 PM org.hsqldb.persist.Logger logInfoEvent
INFO: Checkpoint end - txts: 1
[Server@7ac7a4e4]: Database [index=0, id=0, db=file:bookDbFile, alias=bookdb] opened successfully in 469 ms.
[Server@7ac7a4e4]: Startup sequence completed in 488 ms.
[Server@7ac7a4e4]: 2019-06-14 14:23:23.924 HSQLDB server 2.4.0 is online on port 9001
[Server@7ac7a4e4]: To close normally, connect and execute SHUTDOWN SQL
[Server@7ac7a4e4]: From command line, use [Ctrl]+[C] to abort abruptly
```

You can stop the database by issuing Ctrl+c. However, when deploying our example project, the database must be running at all times. Leave the database running for the rest of this article.

# Creating Wildfly datasource

Now that we have a database server up and running, we want to create a managed datasource such that the application server manages the connection for us. To do so:

1. In the command line, change into the Wildfly bin directory, for example: cd c:/wildfly-11.0.0.Final/bin
2. Add an administrative user:
    * On Windows: add-user.bat -u halfastack -p secr3t -g admin 
    * On Unix: ./add-user.sh -u halfastack -p secr3t -g admin 

You should see something similar:

```
./add-user.sh -u halfastack -p secr3t -g admin
Added user 'halfastack' to file '/Users/marek/Downloads/wildfly-17.0.0.Beta1/standalone/configuration/mgmt-users.properties'
Added user 'halfastack' to file '/Users/marek/Downloads/wildfly-17.0.0.Beta1/domain/configuration/mgmt-users.properties'
Added user 'halfastack' with groups admin to file '/Users/marek/Downloads/wildfly-17.0.0.Beta1/standalone/configuration/mgmt-groups.properties'
Added user 'halfastack' with groups admin to file '/Users/marek/Downloads/wildfly-17.0.0.Beta1/domain/configuration/mgmt-groups.properties'
```

3. Deploy the HSQLDB driver jar file:

    1. Locate the ${HSQLDB_HOME}/lib/hsqldb.jar driver.
    2. Copy the jar driver into the Wildfly standalone deployment directory: `${WILDFLY_HOME}/standalone/deployments/`.
4. Start the server. To start the server, in a command line, issue the following command:
    * On Unix: `${WILDFLY_HOME}/bin/standalone.sh`
    * On Windows: `${WILDFLY_HOME}\bin\standalone.bat` 
    
If you deployed the driver correctly, you should see:

```
14:29:25,268 INFO  [org.jboss.as.server.deployment] (MSC service thread 1-1) WFLYSRV0027: Starting deployment of "hsqldb.jar" (runtime-name: "hsqldb.jar")
14:29:25,843 INFO  [org.jboss.as.connector.deployers.jdbc] (MSC service thread 1-1) WFLYJCA0004: Deploying JDBC-compliant driver class org.hsqldb.jdbc.JDBCDriver (version 2.4)
14:29:25,862 INFO  [org.jboss.as.connector.deployers.jdbc] (MSC service thread 1-6) WFLYJCA0018: Started Driver service with driver-name = hsqldb.jar
14:29:26,021 INFO  [org.infinispan.factories.GlobalComponentRegistry] (MSC service thread 1-4) ISPN000128: Infinispan version: Infinispan 'Infinity Minus ONE +2' 9.4.11.Final
14:29:26,393 INFO  [org.jboss.as.clustering.infinispan] (ServerService Thread Pool -- 76) WFLYCLINF0002: Started client-mappings cache from ejb container
14:29:26,489 INFO  [org.jboss.as.server] (DeploymentScanner-threads - 1) WFLYSRV0010: Deployed "hsqldb.jar" (runtime-name : "hsqldb.jar")
```

At this point, you have started a database server, and deployed driver into the application server. However, the server does not know of the DB server. For that, we create a datasource, which is an abstraction between a database and the application, managed by the application server.

To do so:

1. Navigate to `${WILDFLY_HOME}/bin`, and connect to the CLI:
    * On Unix, execute: `./jboss-cli.sh -c`
    * On Windows, execute: `jboss-cli.bat -c`
2. Enter the following: 
```
/subsystem=datasources/data-source=BookDB:add(jndi-name=java:/jboss/BookDB,driver-name=hsqldb.jar,connection-url=jdbc:hsqldb:hsql://localhost/bookDb,user-name=sa)
```

If done correctly, you should see: `{"outcome" => "success"}`. In the server log, you should see:

```
14:37:40,331 INFO  [org.jboss.as.connector.subsystems.datasources] (MSC service thread 1-1) WFLYJCA0001: Bound data source [java:/jboss/BookDB]
```

3. Enter: `reload` in the jboss-cli environment. After that, you can quit from the CLI by issuing ctrl+c.

You have successfully started your own database server, deployed a driver to your Wildfly application server, and connected the database and application server via a datasource.

# Summary

In this article, you have learned how to:

* Create a database server
* Deploy a JDBC driver on your Java application server (Wildfly in our case) 
* Create a managed datasource

In the next article, you will learn how to use this datasource in your application.
