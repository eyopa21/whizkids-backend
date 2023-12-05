const { request, gql, GraphQLClient } = require("graphql-request");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { sendEmail } = require("./sendMessage");
dotenv.config();
const client = new GraphQLClient(process.env.HASURA_URI, {
  headers: {
    "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
  },
});

exports.attend = async (req, res, next) => {
  const date = new Date();
  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();
  let currentDate = `${year}-${month}-${day}`;
  console.log(currentDate);

  const QUERY = `
  query getAttendances($employee_id: uuid!, $date: date!, $shift: enum_shifts_enum!){
  attendance(where: {employee_id: {_eq: $employee_id}, _and: {_and: {date: {_eq: $date}, _and: {shift: {_eq: $shift}}}}}) {
    id
    created_at
    time
    shift
  }
}


`;
  const HASURA_OPERATION = `
    mutation($employee_id: uuid!, $shift: enum_shifts_enum!) {
  insert_attendance_one(object: {employee_id: $employee_id, shift: $shift}) {
    id
    user {
      email
    }
  }
}
`;
  
  console.log(new Date().getHours())
  
  
  let hour = new Date().getHours();
  let minute = new Date().getMinutes();
  let shift = hour==5? 'morning' : hour==10? 'afternoon':''
  
 
  
  
  
  
  
  
  const { employee_id } = req.body.input;
  
  try {
    const attendance_data = await client.request(QUERY, {
      employee_id,
      date: currentDate,
      shift
    });
    if (!attendance_data.attendance[0] ) {
      console.log("morning")
      const data = await client.request(HASURA_OPERATION, {
        employee_id,
        shift
      });
      if (data.insert_attendance_one) {
        res.json({ ...data.insert_attendance_one });
      } else
        (err) => {
          console.log(err);
          return res.status(400).json({ message: "Attendance failed" });
        };
    } else {
        return res.status(400).json({ message: 'employee has already signed'});
     }
    
  } catch (err) {
    console.log("eroror", err.response.errors[0].message)
    if(err.response.errors[0].message=='Foreign key violation. insert or update on table "attendance" violates foreign key constraint "attendance_employee_id_fkey"'){
      return res.status(400).json({ message: 'There is no such Employee' });
    }
    return res.status(400).json({ message: 'you cannot sign now' });
  }
}
