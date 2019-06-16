---
layout: post
title: "Java EE EJB Beans II: Code Walkthrough"
image: img/testimg-cover.jpg
author: Marek
date: 2018-03-30T07:03:47.149Z
tags: 
  - JEE
  - "Java EE"
  - "EX183"
  - "Red Hat"
---

This post is the practical counterpart of the Java EE EJB Beans I: Introduction article. In this
article, you are going to:

1. Download, build and deploy a JavaEE project
2. Examine CDI and JEE
3. Examine Faces frontend
4. Build up on what you learned and enhance the application

# Exploring the EJB-enabled application 

## Prerequisites

* Wildfly application server is installed and running 
* IDE enabled for Java EE
* You have installed Git on your machine (Optional)

You can view the Java EE Series: Getting Started article for further information about installing Wildfly and IDE.

## Build and deploy

To build and deploy the app:

1. Download it from the github repository. If you have git installed, issue git clone https://github.com/m-czernek/halfastack.com.git Otherwise, download and unzip it manually.
2. Change into the project directory:
    1. On Unix, issue: `cd halfastack.com/EJB_1/`.
    2. On Windows, issue: `cd halfastack.com/EJB_1/`.
3. Build the project with Maven: `mvn clean package`. This command will:
    1. Download all dependencies necessary to run the project (for example the Java EE api, Faces, etc.)
    2. Build a *war* archive with your application.
4. Copy the war archive into the deployments directory of your Wildfly server. In the following steps, _SERVER_HOME_ is the directory where is your Wildfly server:
    1. On Unix, issue: `cp target/EJB_I.war SERVER_HOME/standalone/deployments`
    2. On Windows, issue: `copy target\EJB_I.war SERVER_HOME\standalone\deployments`

To confirm that the deployment, look for the following text in the logs of your server:

```
19:31:42,907 INFO  [org.jboss.as.clustering.infinispan] (ServerService Thread Pool -- 76) WFLYCLINF0002: Started client-mappings cache from ejb container
19:31:42,922 INFO  [io.smallrye.metrics] (MSC service thread 1-5) MicroProfile: Metrics activated
19:31:43,445 INFO  [javax.enterprise.resource.webcontainer.jsf.config] (ServerService Thread Pool -- 76) Initializing Mojarra 2.3.9.SP02 for context '/EJB_I'
19:31:43,931 INFO  [org.wildfly.extension.undertow] (ServerService Thread Pool -- 76) WFLYUT0021: Registered web context: '/EJB_I' for server 'default-server'
19:31:43,994 INFO  [org.jboss.as.server] (DeploymentScanner-threads - 2) WFLYSRV0010: Deployed "EJB_I.war" (runtime-name : "EJB_I.war")
```

You can now access the application at http://localhost:8080/EJB_I/:

![EJB_app](https://raw.githubusercontent.com/m-czernek/halfastack.com/master/EJB_1/imgs/libraryI.png)

## Explore the app
To test the app functionality, you can enter the following values:

* `Jack Kerouac` -> *By author* -> *Find* returns: *Book by author: Jack Kerouac titled: On The Road is available*.
* `Joy Luck Club` -> *By title* -> *Find* returns: *Not available*.

In the app, we have created a mock library database. To keep things very simple, it is a simple Hashmap backed by a Singleton EJB.

## Exploring the source code

Import the project into your IDE. If you installed JBDS, click: *File* -> *Import* -> *Existing Maven Projects* and navigate to the pom.xml file that you downloaded. This will open the app in your IDE. Note several things:

#The pom.xml file

The `pom.xml` file contains dependencies, which are divided into three categories:

1. Frontend–Faces, used for building the simple web interface 
2. JavaEE API–used for leveraging CDI and EJBs
3. Logging dependencies–Used for a simple database initialisation logging

It also contains buildname and the compilation plugin.

## Frontend

Frontend, or the web interface, is in the `src/main/webapp` directory. This is the default directory in which you will add all web-related files. It contains an `index.xhtml` file. Open it to see that it contains the following pieces of code: `#{ expression here }`. That is the expression language (EL). It enables you to integrate HTML with Java.

Object referred in the file is `facesController`, which is a Java class exposed to the frontend. Consider the following:

* `#{class.variable}` translates to `class.getVariable()` or `class.setVariable()` depending on whether the expression is on an input element, or output element.
    * For example, `<h:inputText value="#{facesController.name}"/>` takes the value from the inputText element and sets it on the facesController instance. 
* `#{class.method()}` simply executes the method.
    * For example, `<h:commandButton action="#{facesController.find()}" value="Find" />` executes the `FacesController#find` method when the commandButton is pressed.

Note that `src/main/webapp` also contains the `WEB-INF` directory. That is used for various setting files. We use `web.xml`, which configures the servlet class. Without it, the index file would render only as a regular HTML file and the EL would not get evaluated. Also, our Library app would not have a welcome page.

## Frontend Controllers
In the `index.xhtml` file, you saw `facesController`. You can find the class in
the `com.halfastack.controllers` package. When you open `FacesController.java`, notice the annotations:

```java
@RequestScoped
@Named
public class FacesController { 
    ...
}
```

* *RequestScoped* marks this class as CDI bean. Context Dependency Injecion (CDI) makes a bean managed by the application server. That means this class gets instantiated when necessary, for example, when accessing frontend that utilizes it, and is garbage collected when is no longer required. In our case, the lifecycle of FacesController is one HTTP request. We will dive into CDI later.
* *Named* exposes this class to the EL of the frontend webpage. If no value is given, lower-case name of the class will be used. In our case, it is facesController. You can specify the name as such: `@Named("customName")`.

Explore all the methods and class fields. Notice that we reference an EJB:

```java
@EJB
DBController controller;
```

This enables the application server to instantiate DBController for us and inject it into the FacesController instance. If you explore DBController, notice that it is in fact an EJB:

```java
@Stateless
public class DBController { 
    ...
}
```

Last but not least, notice that DBController is further injecting our database mockup:

```java
@Inject
BookDB database;
```

`@Inject` and `@EJB` both inject (instantiate) a class and pass the reference to the field variable. However, `@EJB` can inject only EJBs, whereas `@Inject` can inject both EJBs and managed beans (CDI beans, for example FacesController).

The BookDB database mockup is then a singleton EJB:

```java
@Singleton
public class BookDB { 
    ...
}
```

## Summary
You now understand the simple logic of the Library workflow. Answer the following:
1. In which directory is your html frontend placed?
2. How do you expose a bean to the frontend website? 3. How do you inject an EJB? (Two annotations)
4. How do you inject a managed bean using CDI?

## Learn by doing
To truly learn, you should enhance the application’s functionality. Feature requests:
1. Add two fields in which users can write the author and title that they want to give to the Library.
2. Add handling in the FacesController class to add those to the database
3. Create methods in the Database object such that the values will be saved into the HashMap and can be queried using the same app.

For example, if a user enters: *Title*: `Joy Luck Club`, *Author*: `Amy Tan`, the user should then be able to search `Joy Luck Club` by title and get a positive answer.

## Undeploy app
To undeploy app, delete the war archive from the `SERVER_HOME/standalone/deployments` directory, both `EJB_I.war` and `EJB_I.war.deployed`.
