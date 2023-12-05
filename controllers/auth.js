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

exports.login = async (req, res, next) => {
  const HASURA_OPERATION = `
query myQuery($email: String!){
users(where: {email: {_eq: $email}}) {
id
email
password
}
}`;
  console.log(await bcrypt.hash("password", 10));
  const { email, password } = req.body.input;
  try {
    const data = await client.request(HASURA_OPERATION, { email });
    console.log(data);
    if (data.users[0]) {
      const match = await bcrypt.compare(password, data.users[0].password);
      if (match) {
        const tokenContents = {
          sub: "user",
          email: data.users[0].email,
          uid: data.users[0].id,
          "https://hasura.io/jwt/claims": {
            "x-hasura-allowed-roles": ["anonymous", "employee"],
            "x-hasura-default-role": "employee",
            "x-hasura-user-id": data.users[0].id.toString(),
          },
        };
        jwt.sign(tokenContents, process.env.JWT_SECRET, (err, token) => {
          if (err) {
            res.sendStatus(403);
          } else {
            return res.json({
              ...data.users[0],
              token: token,
            });
          }
        });
      } else {
        return res.status(400).json({ message: "Password doesnt match" });
      }
    } else {
      return res.status(400).json({ message: "User not found" });
    }
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.registerEmployee = async (req, res, next) => {
  const HASURA_OPERATION = `
mutation ($user_name: String!, $email: String!, $password: String!, $full_name: String!, $salary: Int!, $sex: enum_sex_enum!, $date_of_entry: date!, $role: String!, $phone_number: String!) {
  insert_users_one(object: {user_name: $user_name, password: $password, full_name: $full_name, email: $email, salary: $salary, sex: $sex, role: $role, date_of_entry: $date_of_entry, phone_number: $phone_number}) {
    id
    email
  }
}
`;
  const {
    user_name,
    email,
    password,
    full_name,
    salary,
    sex,
    date_of_entry,
    role,
    phone_number
  } = req.body.input;
  const hashedPassword = await bcrypt.hash(password, 10);
  let code = Math.floor(1000 + Math.random() * 900000).toString();
  try {
    const data = await client.request(HASURA_OPERATION, {
      user_name,
      email,
      password: hashedPassword,
      full_name,
      salary,
      sex,
      date_of_entry,
      role,
      phone_number
    });

    if (data.insert_users_one) {
      const tokenContents = {
        sub: "user",
        email: data.insert_users_one.email,
        uid: data.insert_users_one.id,
        "https://hasura.io/jwt/claims": {
          "x-hasura-allowed-roles": ["anonymous", "employee"],
          "x-hasura-default-role": "employee",
          "x-hasura-user-id": data.insert_users_one.id.toString(),
        },
      };
      const token = jwt.sign(
        tokenContents,
        process.env.JWT_SECRET,
        (err, token) => {
          if (err) {
            res.sendStatus(403);
          } else {
            console.log("res", email);
            return res.json({
              ...data.insert_users_one,
              token: token,
            });
          }
        }
      );
    } else {
      return res.status(400).json({ message: "Registering failed" });
    }
  } catch (err) {
    console.log(err.response.errors[0].message);
    if (
      err.response.errors[0].message ===
      'Uniqueness violation. duplicate key value violates unique constraint "users_email_key"'
    ) {
      return res
        .status(400)
        .json({ message: "THere is an employee with this email" });
    } else {
      return res.status(400).json({ message: err.message });
    }
  }
}


exports.adminLogin = async(req, res, next) => {

    const HASURA_OPERATION = `
      query myQuery($email: String!){
admins(where: {email: {_eq: $email}}) {
id
email
password
}
}`

    const { email, password } = req.body.input;
    try {
        const data = await client.request(HASURA_OPERATION, { email })
        console.log("data", data)
        console.log(data)
        if (data.admins[0]) {
            const match = await bcrypt.compare(password, data.admins[0].password);
            if (match) {
                const tokenContents = {
                    sub: 'user',
                    email: data.admins[0].email,
                    uid: data.admins[0].id,
                    "https://hasura.io/jwt/claims": {
                        "x-hasura-allowed-roles": [ "anonymous","employee", "super-admin"],
                        "x-hasura-default-role": "super-admin",
                        "x-hasura-user-id": data.admins[0].id.toString(),
                    },
                };
                jwt.sign(
                    tokenContents,
                    process.env.JWT_SECRET, (err, token) => {
                        if (err) {
                            res.sendStatus(403)
                        } else {
                            return res.json({
                                ...data.admins[0],
                                token: token
                            });
                        }

                    });

            } else {
                return res.status(400).json({ message: 'Password doesnt match' });
            }

        } else {
            return res.status(400).json({ message: 'Admin not found' });
        }
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }

}