const jwt = require('jsonwebtoken');



// check the user authenticated
// exports.isAuthenticated = async (req, res, next) => {
//     const token = req.cookies.token;
//     // console.log(token)
//     // const token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJ1c2VyIl0sImlhdCI6MTY5NjY0NjIxN30.fqMTaQs9byvD0CwU_8No1uphk4bl9NanRn7ZvYmRbv4";
//     // const token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJhZG1pbiJdLCJpYXQiOjE2OTc3MzIwNzB9.RzJgJ0xWgTsVUoL0OYqhibKOcKb_JldtOgq5k0leJRQ";
//     if (!token) {
//         return res.status(401).json({success: false, message: "You must log In.." }); 
//     }
//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded;
//         next();
//     }
//     catch (error) {
//         console.log(error);
//         return res.status(500).json({success: false,message:'Server error!', error: error.message });
//     }


//     // let authorization = req.headers['authorization'];
//     // if (!authorization || (authorization.split(" ")[0]).toLowerCase() !== 'bearer') return res.status(403).send({
//     //     auth: false,
//     //     message: 'No token provided, use Authentication header to set token'
//     // });
//     // let token = authorization.split(" ")[1]

//     // jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
//     //     if (err) return res.status(500).send({
//     //         auth: false,
//     //         message: 'Failed to authenticate token!'
//     //     });

//     //     req.user = decoded;
//     //     next();
//     // });
// }


// check the user authenticated
exports.isAuthenticated = async (req, res, next) => {
  let token;

  // Check if the token is provided in the cookies
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Token provided in the Authorization header
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "You must log in." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: 'Server error!', error: error.message });
  }
};

  

exports.isAdmin = (req, res, next) => {
    // if (req.user.role !== 'admin' ) {
    if (!req.user.roles.includes('admin')) {
        return res.status(401).json({success: false, message: "Access denied, You must log as an admin." });
    }
    next();
}


exports.isAdmins = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' ) {
        return res.status(401).json({success: false, message: "Access denied, You must log as an admin/superadmin" });
    }
    next();
}


exports.isUser = (req, res, next) => {
    // console.log(req.user.roles);
    // if (req.user.role !== 'user' && req.user.role !== 'admin' ) {
    if (!req.user.roles.includes('admin') && !req.user.roles.includes('user')) {
        return res.status(401).json({success: false, message: "Access denied, You must log as a user/admin." });
    }
    next();
}



  exports.isSales = async (req, res, next) => {
    if (!req.user.roles.includes('admin') && !req.user.roles.includes('sales')) {
    // if (req.user.role !== 'salesmanager' && req.user.role !== 'admin') {
        return res.status(401).json({success: false, message: "Access denied, You must log in as a sales/admin." });
    }
    next();
  }


  exports.isBranch = async (req, res, next) => {
    if (!req.user.roles.includes('admin') && !req.user.roles.includes('branch')) {
    // if (req.user.role !== 'branchmanager' && req.user.role !== 'admin') {
        return res.status(401).json({success: false, message: "Access denied, You must log in as a barnch/admin." });
    }
    next();
  }


  exports.isCustomer = async (req, res, next) => {
    if (!req.user.roles.includes('admin') && !req.user.roles.includes('customer')) {
    // if (req.user.role !== 'customermanager' && req.user.role !== 'admin') {
        return res.status(401).json({success: false, message: "Access denied, You must log in as a customer/admin." });
    }
    next();
  }


  exports.isOrgan = async (req, res, next) => {
    // if (req.user.role !== 'Organ_manager' && req.user.role !== 'admin' ) {
    if (!req.user.roles.includes('admin') && !req.user.roles.includes('organ')) {
        return res.status(401).json({success: false, message: "Access denied, You must log in as a organization/admin." });
    }
    next();
  }

  exports.isProduct = async (req, res, next) => {
    if (!req.user.roles.includes('admin') && !req.user.roles.includes('product')) {
    // if (req.user.role !== 'product_manager' && req.user.role !== 'admin') {
        return res.status(401).json({success: false, message: "Access denied, You must log in as a organization/admin." });
    }
    next();
  }

  exports.isCompany = (req, res, next) => {
    if (req.user.compantType !== "KPE") {
        return res.status(401).json({success: false, message: "You have no access to KPE data." });
    }
    next();
}
