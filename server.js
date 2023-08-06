/*********************************************************************************
* WEB322 – Assignment 06
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part of this
* assignment has been copied manually or electronically from any other source (including web sites) or 
* distributed to other students.
* 
* Name: _Patel Tirth___ Student ID: __172244212_ Date: _5/8/23___
*
* Online (Cyclic) Link: ________________________________________________________
*
********************************************************************************/ 
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const collegeData = require("./modules/collegeData.js");
const session = require("express-session");
const clientSessions = require("client-sessions");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// Configure express-handlebars middleware
// ...

// Configure express-handlebars middleware
app.engine('.hbs', exphbs.engine({ 
    defaultLayout: 'main',
    extname: '.hbs',
    helpers: {
        navLink: function(url, options){
            return '<li' + 
                ((url == app.locals.activeRoute) ? ' class="nav-item active" ' : ' class="nav-item" ') + 
                '><a class="nav-link" href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }        
    }
}));

  
  app.set("view engine", ".hbs");
  


// Middleware to serve static files
app.use(express.static(path.join(__dirname, "public")));

// Middleware to parse the body of incoming requests
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware for client sessions
app.use(
  clientSessions({
    cookieName: "session",
    secret: "assignment6_web322",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60,
  })
);

// Middleware to set the active route for handlebars
app.use(function (req, res, next) {
  let route = req.baseUrl + req.path;
  app.locals.activeRoute = route == "/" ? "/" : route.replace(/\/$/, "");
  next();
});

// Middleware to ensure login before accessing restricted routes
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

// Home route
app.get("/", ensureLogin, (req, res) => {
  res.render("login");
});

// About route
app.get("/about", (req, res) => {
  res.render("about");
});

// HTML Demo route
app.get("/htmlDemo", (req, res) => {
  res.render("htmlDemo");
});

// Students routes
app.get("/students", ensureLogin, (req, res) => {
  if (req.query.course) {
    collegeData
      .getStudentsByCourse(req.query.course)
      .then((data) => {
        if (data.length > 0) {
          res.render("students", { students: data });
        } else {
          res.render("students", { message: "No results" });
        }
      })
      .catch((err) => {
        res.render("students", { message: "Error fetching students" });
      });
  } else {
    collegeData
      .getAllStudents()
      .then((data) => {
        if (data.length > 0) {
          res.render("students", { students: data });
        } else {
          res.render("students", { message: "No results" });
        }
      })
      .catch((err) => {
        res.render("students", { message: "Error fetching students" });
      });
  }
});

app.get("/students/add", ensureLogin, (req, res) => {
  collegeData
    .getCourses()
    .then((data) => res.render("addStudent", { courses: data }))
    .catch((err) => {
      res.render("addStudent", { courses: [] });
    });
});

app.post("/students/add", ensureLogin, (req, res) => {
  const studentData = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    course: req.body.course,
    TA: req.body.TA === "on",
  };

  collegeData
    .addStudent(studentData)
    .then(() => {
      res.redirect("/students");
    })
    .catch((err) => {
      res.status(500).send("Unable to Add Student");
    });
});

app.get("/students/:studentNum", ensureLogin, (req, res) => {
  let viewData = {};
  collegeData
    .getStudentByNum(req.params.studentNum)
    .then((data) => {
      viewData.student = data ? data : null;
    })
    .catch(() => {
      viewData.student = null;
    })
    .then(collegeData.getCourses)
    .then((data) => {
      viewData.courses = data;
      for (let i = 0; i < viewData.courses.length; i++) {
        if (viewData.courses[i].courseId == viewData.student.course) {
          viewData.courses[i].selected = true;
        }
      }
    })
    .catch(() => {
      viewData.courses = [];
    })
    .then(() => {
      if (!viewData.student) {
        res.status(404).send("Student Not Found");
      } else {
        res.render("student", { viewData: viewData });
      }
    });
});

app.post("/student/update", ensureLogin, (req, res) => {
  const studentData = {
    studentNum: req.body.studentNum,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    course: req.body.course,
    TA: req.body.TA === "on",
  };

  collegeData
    .updateStudent(studentData)
    .then(() => {
      res.redirect("/students");
    })
    .catch((err) => {
      res.status(500).send("Unable to Update Student");
    });
});

app.get("/students/delete/:studentNum", ensureLogin, (req, res) => {
  collegeData
    .deleteStudentByNum(req.params.studentNum)
    .then(() => {
      res.redirect("/students");
    })
    .catch((err) => {
      res.status(500).send("Unable to Remove Student / Student not found");
    });
});

// Courses routes
app.get('/courses', (req, res) => {
    collegeData.getCourses()
      .then((courses) => {
        res.render('courses', { courses: courses });
      })
      .catch((err) => {
        console.error('Error fetching courses:', err);
        res.status(500).send('Unable to fetch courses');
      });
  });

 app.get("/courses/add",  (req, res) => {
  res.render("addCourse");
});

app.post("/courses/add",  (req, res) => {
  data.Course.create({
    courseCode: req.body.courseCode,
    courseDescription: req.body.courseDescription,
  })
    .then(() => {
      res.redirect("/courses");
    })
    .catch((err) => {
      console.error("Error adding course:", err);
      res.redirect("/courses");
    });
});


app.post("/course/update",ensureLogin, (req, res) => {
    data.updateCourse(req.body).then(() => {
        res.redirect("/courses");
    });
});

app.get("/courses/:id",ensureLogin, (req, res) => {
    data.getCourseById(req.params.id).then((data) => {
        if(data != undefined)
        res.render("course", { course: data }); 
    else
        res.status(404).send("Course Not Found")
    }).catch((err) => {
        res.render("course",{message:"no results"}); 
    });
});

app.get("/courses/delete/:id",ensureLogin, (req, res) => {
    data.deleteCourseById(req.params.id).then((data) => {
        res.redirect("/courses"); 
    }).catch((err) => {
        res.status(500).send("Unable to Remove Course / Course not found")
    });
});

// Login route
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  if (
    req.body.username === "sampleuser" &&
    req.body.password === "samplepassword" 
  ) {
    req.session.user = req.body.username;
    res.redirect("/dashboard");
  } else {
    res.render("login", { error: "Invalid username or password" });
  }
});
app.get("/dashboard", (req, res) => {
    res.render("dashboard");
  });
app.get("/home", (req, res) => {
    res.render("home");
  });
// Logout route
app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/login");
});

// 404 Not Found
app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

collegeData
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("Server listening on: " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.error("Unable to start the server:", err.message);
  });
