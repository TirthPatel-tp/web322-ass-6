const Sequelize = require('sequelize');
const fs = require('fs');

const sequelize = new Sequelize('rnzsrnvl', 'rnzsrnvl', '8Fo4_cX4N_QS-41yT2oVYU6ACHqmYlVh', {
  host: 'peanut.db.elephantsql.com',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
  },
  query: { raw: true },
});

const Student = sequelize.define('Student', {
  studentNum: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  firstName: Sequelize.STRING,
  lastName: Sequelize.STRING,
  email: Sequelize.STRING,
  addressStreet: Sequelize.STRING,
  addressCity: Sequelize.STRING,
  addressProvince: Sequelize.STRING,
  status: Sequelize.STRING,
  TA: Sequelize.BOOLEAN,
});

const Course = sequelize.define('Course', {
  courseId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  courseCode: Sequelize.STRING,
  courseDescription: Sequelize.STRING,
});

class Data {
  constructor(students, courses) {
    this.students = students;
    this.courses = courses;
  }
}

let dataCollection = null;

module.exports.initialize = function () {
    return new Promise( (resolve, reject) => {
        fs.readFile('./data/courses.json','utf8', (err, courseData) => {
            if (err) {
                reject("unable to load courses"); return;
            }

            fs.readFile('./data/students.json','utf8', (err, studentData) => {
                if (err) {
                    reject("unable to load students"); return;
                }

                dataCollection = new Data(JSON.parse(studentData), JSON.parse(courseData));
                resolve();
            });
        });
    });
}

module.exports.getAllStudents = function(){
    return new Promise((resolve,reject)=>{
        if (dataCollection.students.length == 0) {
            reject("query returned 0 results"); return;
        }

        resolve(dataCollection.students);
    })
}


module.exports.getCourses = function(){
    return new Promise((resolve,reject)=>{
     if (dataCollection.courses.length == 0) {
         reject("query returned 0 results"); return;
     }
 
     resolve(dataCollection.courses);
    });
 };
  
module.exports.getStudentByNum = function (num) {
    return new Promise(function (resolve, reject) {
        var foundStudent = null;

        for (let i = 0; i < dataCollection.students.length; i++) {
            if (dataCollection.students[i].studentNum == num) {
                foundStudent = dataCollection.students[i];
            }
        }

        if (!foundStudent) {
            reject("query returned 0 results"); return;
        }

        resolve(foundStudent);
    });
};

module.exports.getStudentsByCourse = function (course) {
    return new Promise(function (resolve, reject) {
        var filteredStudents = [];

        for (let i = 0; i < dataCollection.students.length; i++) {
            if (dataCollection.students[i].course == course) {
                filteredStudents.push(dataCollection.students[i]);
            }
        }

        if (filteredStudents.length == 0) {
            reject("query returned 0 results"); return;
        }

        resolve(filteredStudents);
    });
};

module.exports.getCourseById = function (id) {
    return new Promise(function (resolve, reject) {
        var foundCourse = null;

        for (let i = 0; i < dataCollection.courses.length; i++) {
            if (dataCollection.courses[i].courseId == id) {
                foundCourse = dataCollection.courses[i];
            }
        }

        if (!foundCourse) {
            reject("query returned 0 results"); return;
        }

        resolve(foundCourse);
    });
};

module.exports.addStudent = function (studentData) {
    return new Promise(function (resolve, reject) {

        studentData.TA = (studentData.TA) ? true : false;
        studentData.studentNum = dataCollection.students.length + 1;
        dataCollection.students.push(studentData);

        resolve();
    });

};

module.exports.updateStudent = function (studentData) {
    return new Promise(function (resolve, reject) {

        studentData.TA = (studentData.TA) ? true : false;

        for(let i=0; i < dataCollection.students.length; i++){
            if(dataCollection.students[i].studentNum == studentData.studentNum){
                dataCollection.students[i] = studentData;
            }
        }
        resolve();
    });
};

module.exports.getAllCourses = function () {
    return Course.findAll({
      attributes: ['courseId', 'courseCode', 'courseDescription'],
    });
  };
  
  
  
  module.exports.addCourse = function (courseData) {

    console.log(courseData)

    for(const key in courseData)
    {
        if(courseData[key]=="")
        courseData[key] = null;
    }
    return new Promise(function (resolve, reject) { 
        Course.create({
            courseCode: courseData.courseCode,
            courseDescription: courseData.courseDescription,
        }).then(
            function (crs) {
                console.log("course created");
                resolve("course created successfuly");
            }
        ).catch(()=>reject("unable to create course"));
    });

};

module.exports.updateCourse = function (courseData) {

    for(const key in courseData)
    {
        if(courseData[key]=="")
             courseData[key] = null;
    }
    return new Promise(function (resolve, reject) { 
        Course.update({
            courseCode: courseData.courseCode,
            courseDescription: courseData.courseDescription,
        },{
            where: { courseId:courseData.courseId }
        }
        ).then(
            function (crs) {
                console.log(`course ${crs.courseId} updated successfuly`);
                resolve(`course ${crs.courseId} updated successfuly`);
            }
        ).catch(()=>reject("unable to update course"));
    });

};

module.exports.deleteCourseById = function (id) {
    return new Promise(function (resolve, reject) { 

        sequelize.sync().then(
            function () {
                Course.destroy({ 
                    where: {
                        courseId: id
                    }
                    }).then(function(){        
                        console.log("destroyed");
                        resolve("destroyed");
                     }).catch(()=>reject("destroy was rejected"))
            }
        ).catch(()=>reject("destroy was rejected"));
    });
};