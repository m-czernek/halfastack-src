---
layout: post
title: "Jazzy security with JAAS"
image: img/testimg-cover.jpg
author: Ghost
draft: false
date: 2018-05-28T08:03:47.149Z
tags: 
  - JEE
  - "Java EE"
  - "EX183"
  - "Red Hat"
---
In the previous posts about REST, we learned how to expose methods such that they are available over the HTTP protocol, for a variety of reasons. Notice though that the REST endpoints are accessible to everyone who knows of them, or who can discover them. The EX183 then mandates that aspiring Java EE developers know the very basics of _JAAS_, or the Java Authentication and Authorization Service.

Let’s jump into coding with the following example:

```java
@RolesAllowed({"developer"}) // <1> 
@GET
@Path("/getDeveloperHello")
public String getDeveloperHello() {
  return "Hello for developers";
} 
@RolesAllowed("guest") //<2>
@GET
@Path("/getGuestOnlyHello")
public String getGuestExclusiveHello() {
  return "Hello for guests";
}

@PermitAll //<3>
//@RolesAllowed({"guest","developer"})
@GET
@Path("/getHello")
public String getHello() {
  return "Hello for guests and developer";
}
```

This is a very basic example of JAAS that is quite familiar to readers who have experience with REST. A couple of points on applying JAAS:
1. We see that the main thing JAAS provides in Java EE is a set of handy annotations. Here, we are using the `javax.annotation.security.RolesAllowed` annotation to specify roles of registered users that have access to the particular endpoint. In <1>, we see that `RolesAllowed` takes an array of roles.
2. In point <2>, we also see that if you require only one role for the endpoint, `RolesAllowed` can take a single String parameter.
3. Point <3> then introduces a new annotation to permit all roles that are defined for the application. Alternatively, you can also see a `RolesAllowed`, which permits both roles as described in <1>. In this instance, the `PermitAll` and `RolesAllowed` have the same effect.

Upon accessing the endpoint, the user is greeted with a login prompt. Based on the username and password he or she enters, Wildfly automatically checks whether the user is authenticated and authorised to access the endpoint (the difference between authentication and authorisation will be discussed in another article).

Further helpful security annotations include:
* `@DenyAll`: Deny all from executing this endpoint directly. Other endpoints can still use this method.
* `@DeclareRoles({"developer", "guest"})`: A class-level annotation that declares roles to be used for your application. It is an alternative to using the web.xml file to declare your roles.

So what should you do to get the code above working?

1. Define users and roles in your application server
2. Define which endpoints should require authentication
3. Define which type of authentication should your application use, and where the user credentials are stored

# 1. Defining users and user roles

Wildfly uses security domains to define where usernames, user passwords, and user roles are stored. The most common types of security domains include:

* User information stored in a database with custom SQL statements for authentication. 
* User information stored in a new-line separated text file (.properties file).
* User information stored in another server, such as LDAP, Kerberos, or others.

In our example, we will be using Wildfly’s ApplicationRealm domain, which is a simple set of text files that can be altered using the adduser.sh or adduser.bat script. To add our two users:

1. On the command line, navigate to the ${WILDFLY_HOME}/bin directory, for example: cd c:/wildfly-12.0.0.Final/bin.
2. Add the developer user:
  * On Windows: `add-user.bat -a -u developer -p developer -g developer` 
  * On Unix: `./add-user.sh -a -u developer -p developer -g developer`
3. Add the guest user:
  * On Windows: `add-user.bat -a -u guest -p guest -g guest`
  * On Unix: `./add-user.sh -a -u guest -p guest -g guest` 

You should see output similar to:

```
Added user 'guest' to file '/Users/marek/wildfly-17.0.0.Beta1/standalone/configuration/application-users.properties'
Added user 'guest' to file '/Users/marek/wildfly-17.0.0.Beta1/domain/configuration/application-users.properties'
Added user 'guest' with groups guest to file '/Users/marek/wildfly-17.0.0.Beta1/standalone/configuration/application-roles.properties'
Added user 'guest' with groups guest to file '/Users/marek/wildfly-17.0.0.Beta1/domain/configuration/application-roles.properties'
```

You can explore the **standalone** files, since we are using Wildfly in the standalone mode:

## application-users.properties

The `${WILDFLY_HOME}/standalone/configuration/application-users.properties` file contains a list of username and passwords:

``` shell
developer=97df44a197a58de9674af3cd139df47e # Note for the reader: password is developer 
guest=b5d048a237bfd2874b6928e1f37ee15e #Note for the reader: password is guest
```

## application-roles.properties

The `${WILDFLY_HOME}/standalone/configuration/application-roles.properties` file contains a list of username and roles:

```
guest=guest
developer=developer
```

With that, our server is ready for our application.

# 2. Specifying URL path for authentication

With any application you want to secure, it is a good idea to apply JAAS selectively. After all, you probably want your index page to be accessible by anyone, but maybe you require registration for just the REST services. This is done from within our application’s web.xml.

## What you need to know about web.xml

* It is a basic settings file that instructs your application how to behave, what settings or filters to apply, etc.
* It should be placed in `src/main/webapp/WEB-INF`.
* Some of the configuration can be replaced by annotations. This may or may not be a good idea, depending on your use-case.

## Securing our api

To secure the api, create the `src/main/webapp/WEB-INF/web.xml` file:

```xml
<web-app 
    version="3.1" 
    xmlns="http://xmlns.jcp.org/xml/ns/javaee" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd">

</web-app>
```

In `web.xml`:

1. Define the security constraint:

```xml
<!-- Start of security constraint definition -->
<security-constraint>
       <!-- Define which URL pattern should be protected -->
       <web-resource-collection>
               <web-resource-name>Hello JAAS</web-resource-name>
               <!-- everything behind /api/ will be protected. For example,
               localhost:8080/helloWorld/api/getName.
               However, localhost:8080/helloWorld would not be protected. -->
               <url-pattern>/api/*</url-pattern>
       </web-resource-collection>
       <!-- Define roles which are authorized to enter -->
       <auth-constraint>
               <role-name>developer</role-name>
               <role-name>guest</role-name>
       </auth-constraint>
</security-constraint>
```

2. Define the rolenames:

```xml
<!-- Defining valid roles for our example -->
<security-role>
  <role-name>developer</role-name>
</security-role>
<security-role>
  <role-name>guest</role-name>
</security-role>
```

3. Define the following parameter so that our application turns on RESTEasy role-based security:

```xml
<context-param>
  <param-name>resteasy.role.based.security</param-name>
  <param-value>true</param-value
</context-param>
```

While it may look like a lot of text, your IDE should be capable of code-completion of the XML file based on the xsd definition.

# 3. Specifying authentication type

For our application, we use Wildfly’s default security domain called ApplicationRealm. As such, it is very simple to refer the authentication type in `web.xml`:

```xml
<login-config>
  <auth-method>BASIC</auth-method>
  <realm-name>ApplicationRealm</realm-name>
</login-config>
```

With that, you have a very simple yet working set of JAAS-secured REST endpoints. See the full [web.xml](https://github.com/m-czernek/halfastack.com/blob/master/JAAS_EXAMPLE_1/src/main/webapp/WEB-INF/web.xml) and the [deployable application](https://github.com/m-czernek/halfastack.com/tree/master/JAAS_EXAMPLE_1) for complete information on the source code!

# Application summary

The application has three endpoints. If you run your server on localhost and port 8080, you can access the endpoints at:

* `localhost:8080/JAAS_EXAMPLE_1/api/jaas/getDeveloperHello`
* `localhost:8080/JAAS_EXAMPLE_1/api/jaas/getGuestOnlyHello`
* `localhost:8080/JAAS_EXAMPLE_1/api/jaas/getHello`

We set it such that all endpoints ending containing `/api/` on their path are required to authenticate. Depending on which credentials you enter, you’ll be able to access only select endpoints as per the application’s JAAS role settings. Since all endpoints are GET endpoints, you can access them from your browser as well as from any REST client.

# Quick-dive summary

In this quick-dive article into JAAS, you have:
* Implemented basic JAAS authentication and authorization for your REST endpoint 
* Learned about the web.xml descriptor file
* Learned about Wildfly’s security domains and the basic ApplicationRealm security domain
