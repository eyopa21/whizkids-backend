const { request, gql, GraphQLClient } = require("graphql-request");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
const { sendEmail } = require('./sendMessage')
dotenv.config();
const client = new GraphQLClient(process.env.HASURA_URI, {
    headers: {
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET
    }
});

exports.logs = async(req, res, next) => {
   const HASURA_OPERATION = `
     mutation( $method: String!, $role: String!, $description: String!, $table: String!) {
      insert_logs_one(object: {role: $role, method: $method, description: $description, table: $table}) {
    id
  }
}

`
  const QUERY = `query myQuery($id: uuid!){
  users_by_pk(id: $id) {
    first_name
    last_name
    email
    user_name
  }
  guests_by_pk(id: $id) {
    user_name
    email
  }
}
`
   const {event, table} = req.body;
//console.log(req.body)
let role ;
let guestId;
  let userId;
 console.log(event.session_variables)
    role = Object.values( event.session_variables)[0]
   
     userId = Object.values( event.session_variables)[1]
  

  try {
   
    
   
     let description = 'description';
      const data = await client.request(HASURA_OPERATION, {  role: role ,method: event.op, description, table: table.name})
       
        if (data.insert_logs_one) {
            
             res.json({status: "success"});
        } else {
          
            return res.status(400).json({ message: 'Log inserting failed' });
        }
  
       
       

    } catch (err) {
      console.log(err)
        return res.status(400).json({ message: err.message });
    }

     
}