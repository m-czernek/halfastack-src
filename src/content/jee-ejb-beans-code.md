---
layout: post
title: "Java EE EJB Beans II: Code Walkthrough"
image: img/testimg-cover.jpg
author: Ghost
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
3. Build the project with Maven: mvn clean package. This command will:
    1. Download all dependencies necessary to run the project (for example the Java EE api, Faces, etc.)
    2. Build a *war* archive with your application.
4. Copy the war archive into the deployments directory of your Wildfly server. In the following steps, _SERVER_HOME_ is the directory where is your Wildfly server:
    1. On Unix, issue: `cp target/EJB_I.war SERVER_HOME/standalone /deployments`
    2. On Windows, issue: `copy target\EJB_I.war SERVER_HOME\standalone \deployments`

To confirm that the deployment, look for the following text in the logs of your server:


You can now access the application at http://localhost:8080/EJB_I/:

