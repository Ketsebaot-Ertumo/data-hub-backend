const {sequelize} = require('../models/index')
const DataTypes = require('sequelize');
const userActivity = require('../utilis/userActivity');
const User = require('../models/userModel')(sequelize, DataTypes);
const RP = require('../models/rpModel')(sequelize, DataTypes);
const UR = require('../models/userRoleModel')(sequelize, DataTypes);





exports.showAll = async (req, res) => {
  try{
    const roles = await RP.findAll({attributes: ['role', 'docType','permissions']});
    res.status(200).json({success: true,roles });
  }catch(err){
    console.log('error occured', err);
    res.status(500).json({success:false, error: err.message})
  }
}


exports.showRoles = async (req, res) => {
  const {email} = req.query;
  try{
    if(!email){
      return res.status(402).json({success:false, message: 'Please provide email.'})
    }
    const user = await User.findOne({where: {email},attributes: ['roles']});
    res.status(200).json({success: true,roles:user.roles });
  }catch(err){
    console.log('error occured', err);
    res.status(500).json({success:false, error: err.message})
  }
}


exports.roles = async (req, res) => {
  try{
    const roles = await RP.findAll({attributes: ['role']});
    res.status(200).json({success: true,roles });
  }catch(err){
    console.log('error occured', err);
    res.status(500).json({success:false, error: err.message})
  }
}



exports.updateRole = async (req, res) => {
  const { email, newRoles } = req.body;
  try{
    if(!email || !newRoles){
      return res.status(402).json({success:false,message:'Please provide email or newRoles.'})
    }
    const user = await User.findOne({ where: { email:email.toLowerCase() } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }
    let update;const roles=[];
     const existing = await UR.findOne({ where: { email:email.toLowerCase() } });
 
     const filter = newRoles.filter((role, index, arr) => {
       const firstIndex = arr.findIndex(p => p.role === role.role);
       return firstIndex === index; // Keep the first occurrence, remove all subsequent occurrences
     });
    //  console.log('existing-before',existing.roles,'new Roles:',newRoles,'filtered',filter)
     if(existing){
      const hasAdmin = filter.some(role => role.role === "admin" && role.granted === true);
      // console.log('hasAdmin',hasAdmin)
        if(!hasAdmin){
          const hasA = existing.roles.some(role => role.role === "admin" && role.granted === true);
          const has = filter.some(role => role.role === "admin" && role.granted !== true);
          if(hasA && !has){
            return res.status(400).json({ success: false, message: 'Already has "admin" role!' });
          }
        const updatedRoles = [...existing.roles];

        filter.forEach(updatedRole => {
          const existingRoleIndex = updatedRoles.findIndex(role => role.role === updatedRole.role);
          if (existingRoleIndex !== -1) {
            updatedRoles[existingRoleIndex] = updatedRole;
          } else {
            updatedRoles.push(updatedRole);
          }
        });
        // console.log("updated",updatedRoles)
        existing.roles = updatedRoles;
       }else {
         data=[{role:'admin',granted:true}]
         existing.roles=data //save existing
         }
         console.log('existingUpdated:',existing.roles); //save existing
         existing.roles.forEach(role => {
          const roleName = role.role;
          const granted = role.granted;
          if(granted===true){
            roles.push(roleName)
          }
        });
        if(roles.length === 0){
          const defaultValue= "guest";
          roles.push(defaultValue);
        }
        console.log('roles',roles)
        user.roles=roles;
        await user.save();
        await existing.save();
        return res.status(200).json({success:true,message:'Successfully updated.',user:{email,roles:existing.roles},roles:user.roles})
       }
    else{
      const hasAdmin = filter.some(role => role.role === "admin" && role.granted === true);
      console.log('hasAdmin',hasAdmin)
         if(hasAdmin){
           const data = filter.map(role => {
             return { ...role, granted: true };
           });console.log(data);
           defaultValue= [ {role: "guest",granted:false}, {role:"user",granted:false}, {role:"admin",granted:true}, {role:"customer",granted:false},{role:"branch",granted:false}, {role:"sales",granted:false},{role:"product",granted: false},{role:"organ",granted: false} ];
           const mergedRoles = [...defaultValue];

           data.forEach(updatedRole => {
             const existingRoleIndex = mergedRoles.findIndex(role => role.role === updatedRole.role);
             if (existingRoleIndex !== -1) {
               mergedRoles[existingRoleIndex] = updatedRole;
             } else {
               mergedRoles.push(updatedRole);
             }
           });
           console.log('merged',mergedRoles); //save this
          //  update = await UR.create({email:email.toLowerCase(), roles: mergedRoles });
         }else{
           const defaultValue= [ {role: "guest",granted:false}, {role:"user",granted:false}, {role:"admin",granted:false}, {role:"customer",granted:false},{role:"branch",granted:false}, {role:"sales",granted:false},{role:"product",granted: false},{role:"organ",granted: false} ];
           // const mergedPermissions = [];

           const mergedRoles = [...defaultValue];
          console.log("filtered1",filter)
           filter.forEach(role => {
             const { role: roleName, granted } = role;

             const existingRoleIndex = mergedRoles.findIndex(p => p.role === roleName);

             if (existingRoleIndex !== -1) {
               // Update the "granted" value if the permission already exists
               mergedRoles[existingRoleIndex].granted = granted === 'true';
             } else {
               // Add the permission to the "merged" list if it doesn't exist
               mergedRoles.push({ role: roleName, granted: granted === 'true' });
             }
           });
           console.log('filtered',filter,'merged',mergedRoles);
          //  update = await UR.create({email:email.toLowerCase(), roles: mergedRoles });
         }
         update = await UR.create({email:email.toLowerCase(), roles: mergedRoles });
         await update.save();
         res.status(201).json({success:true,message:'Successfully created.',user: update})
       }
       if(req.user.email !== undefined){
          await userActivity(`set role to user ${email}. `, req.user.email );
        }
    }catch(err){
       console.log(err)
       res.status(500).json({success:false,error:err.message})
     }
}




// //update role
// exports.updateRole = async (req, res) => {
//   const { email, newRoles } = req.body;
//   // const expectedRoles = ["admin", "user", "guest", "sales", "organ", "branch", "product", "customer"];
//   // const newR = newRoles.map(role => role.role);
//   // if (!newR.every(role => expectedRoles.includes(role))) {
//   //   return res.status(402).json({
//   //     success: false,
//   //     message: "Please use correct role name on roles array."
//   //   });
//   // }
//   try {
//     if(!email || !newRoles){
//       return res.status(402).json({success:false,message:'Please provide email or newRoles.'})
//     }
//     const user = await User.findOne({ where: { email:email.toLowerCase() } });
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found!' });
//     }
//    const newRol = [];
//    for (let i = 0; i < newRoles.length; i++) {
//     const role = newRoles[i];
//     const duplicateRoleIndex = newRoles.findIndex(rol => rol.role === role.role);
//     console.log("dup",duplicateRoleIndex)
//     // if (duplicateRoleIndex === -1) {
//     if (duplicateRoleIndex === -1 || duplicateRoleIndex === i) {
//       newRol.push(role);
//     }
//   }
//   console.log(newRol)
//   // try {
//     let rol;const r=[] ;let Roles;const roles=[];
//     const existingRoles = await UR.findOne({ where: { email:email.toLowerCase() } });
//     // console.log(existingRoles)
//     if (existingRoles !== null) {
//       for(let i=0;i<newRol.length;i++){
//           for(let j=0;j<existingRoles.roles.length;j++){
//             const newRole = newRol[i];
//             const newE = existingRoles.roles[j];
//             isSame =newRole.role === newE.role && newRole.granted === newE.granted;
//             if(isSame){r.push(isSame)}
//           }}
//         if(r.length === newRol.length){ 
//           isSame=true
//         }else{ 
//           isSame=false
//         }
//         // console.log(isSame)
//         if (!isSame) {
//             for (let i = 0; i < newRol.length; i++) {
//                 const  newRole = newRol[i];
//                 const Roles = existingRoles.roles.map(value => value.role.includes(newRole.role) ? newRole : value);
//                 existingRoles.roles = Roles;
//               }
//               // existingRoles.roles = Roles;
//             for(let j=0;j<existingRoles.roles.length;j++){
//               const Role = existingRoles.roles[j];
//               if(Role.granted === true){
//                 roles.push(Role.role);
//               }
//             }
//             if(roles.length === 0){
//               const defaultValue= "guest";
//               roles.push(defaultValue);
//             }
//             user.roles=roles;
//             await existingRoles.save();
//             await user.save();
//             return res.status(200).json({success:true,message:'Roles updated.',roles:existingRoles.roles,user:user.roles})
//         }
//         else{
//           return res.status(303).json({message: 'Have no updates,Roles are already seted.', roles:user.roles,newRoles:newRoles,existingRoles:existingRoles.roles})};
//     } else {
//       console.log(existingRoles);
//         const defaultValue= [ {role:"guest",granted: false},{role:"admin",granted: false}, {role:"user" ,granted: false}, {role:"sales" ,granted: false}, {role:"branch" ,granted: false},{role:"organ",granted: false}, {role:"customer",granted: false},{role:"product",granted: false} ];
//         Roles = defaultValue.filter(role => {
//           // return !newRol.some(newRole => newRole.role === role.role && newRole.granted);
//           return !newRol.some(newRole => newRole.role === role.role);
//         });
//         console.log("====Roles:",Roles)
//         for (let i = 0; i < newRol.length; i++) {
//           const  newRole = newRol[i];
//           Roles.push(newRole);
//         }
//         rol = await UR.create({ email,roles: Roles });
//         for(let j=0;j<rol.roles.length;j++){
//           const Role = rol.roles[j];
//           if(Role.granted === true){
//             roles.push(Role.role);
//             if(roles.length===0){
//               const defaultValue= "guest";
//               roles.push(defaultValue);
//             }
//           }else{
//             continue;
//           }
//         }
//         user.roles=roles;
//         await user.save();
//     }
//     await rol.save();
//     if(req.user.email !== undefined){
//       await userActivity(`update role ${roles} for '${user.email}'. `, req.user.email );
//     }
//     res.status(200).send({success:true,message:'Role permissions created.',roles:rol.roles,user:user.roles });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).send(error.message);
//   }
//   };




// //update role
// exports.updateRole = async (req, res) => {
//   const { email, UpdatedRole, NewRole } = req.body;
//   if(!email || !UpdatedRole || !NewRole){
//       return res.status(400).json({success:false, message:"Please add email or updatedRole or newRole."});
//     }
//   try {
//     const updatedRole = UpdatedRole.toLowerCase();
//     const newRole = NewRole.toLowerCase();
//     const role = await RP.findOne({where: {role:newRole}});
//     if(!role){
//       return res.status(401).json({success:false, message: 'Please give correct name of role.' });
//     }
//     // console.log("role",role.role,"newRole",newRole)
//     const user = await User.findOne({ where: { email:email.toLowerCase() } });
//     if (!user) {
//       return res.status(404).json({success:false, message: 'User not found' });
//     }
//     // const roles = user.roles || [];
//     const existingRoles = user.roles || [];
//     const roles = [];
//     const updatedRoleIndex = existingRoles.indexOf(updatedRole.toLowerCase);
//     if (updatedRoleIndex === -1) {
//       return res.status(404).json({success:false, message:"Updated role not found"});
//     }
//     if (newRole === "admin") {
//       const userRoleIndex = existingRoles.indexOf("User");
//       if (userRoleIndex !== -1) {
//         existingRoles.splice(userRoleIndex, 1);
//       }
      
//       existingRoles.length = 0; 
//       // existingRoles.push(newRole);
//       roles.push(newRole);
//       user.roles = roles;
//     } else {
//       if (existingRoles.includes(newRole)) {
//         const updatedRoles = existingRoles.filter(role => role !== updatedRole);
//         // existingRoles.splice(updatedRoleIndex, 1);
//         for (let i = 0; i < updatedRoles.length; i++) {
//           const newRole = updatedRoles[i];
//           roles.push(newRole);
//           user.roles = roles;
//         }
//       } else {
//         // existingRoles[updatedRoleIndex] = newRole;
//         const Roles = existingRoles.map(role => role === updatedRole ? newRole : role);
//         // console.log(Roles);
//         for (let i = 0; i < Roles.length; i++) {
//           const newRole = Roles[i];
//           roles.push(newRole);
//           user.roles = roles;
//         }
//       }
//     }
//     // user.roles = existingRoles;
//     await user.save();
//     if(req.user.email !== undefined){
//       await userActivity(`updated to '${newRole}' role for '${user.email}'. `, req.user.email );
//     }
//     res.status(200).json({success: true, message: 'User role updated successfully',user:user.roles,});
//   } catch (err) {
//     console.log(err)
//     res.status(400).json({success:false, error: err.message });
//   }
// };




// //set roles
// exports.setRole = async (req, res) => {
//       try {
//         const { email, roles } = req.body;
//         const user = await User.findOne({ where: { email:email.toLowerCase() } });
//         if (!user) {
//           return res.json({ success: false, message: 'User not found.' });
//         }
//         for(let i=0; i< roles.length; i++){
//           const Role = roles[i].toLowerCase();
//           const role = await RP.findOne({where: {Role}});
//           if(!role){
//             return res.status(401).json({success:false, message: 'Please give correct name of role.' });
//           }
//         }
//         const existingRoles = user.roles || [];
//         const newRoles = [];
//         for (let i = 0; i < roles.length; i++) {
//           const role = roles[i].toLowerCase();
//           const Role = await RP.findOne({where: {role}});
//           if(!Role){
//             continue;
//           }
//           if (existingRoles.includes(role)) {
//             continue;
//           }
//           if (existingRoles.includes('admin')) {
//             return res.json({ success: false, message: 'This user is already admin.' });
//           }
//           if (roles.includes('admin')) {
//             const existingRoleIndex = existingRoles.indexOf("User");
//             if (existingRoleIndex !== -1) {
//               roles.splice(existingRoleIndex, 1);
//             }
//             existingRoles.length = 0; 
//             newRoles.push(roles[i]);
//             user.roles = newRoles;
//           }
//           else{
//           newRoles.push(role);
//           user.roles = [...existingRoles, ...newRoles];}
//         }
//         if (newRoles.length === 0 ) {
//           return res.json({ success: false, message: 'Roles already set for the user.' });
//         }
//         // user.roles = [...existingRoles, ...newRoles];
//         await user.save();
//         if(req.user.email !== undefined){
//           await userActivity(`seted '${roles}' roles for '${user.email}'. `, req.user.email );
//         }
//         res.status(200).send({success:true,message:'User roles set.',user});
//       } catch (error) {
//         console.error('Error:', error);
//         res.status(500).json({success:false,error: error.message});
//       }
// }






//     //delete role
//     exports.deleteRole = async (req, res) => {
//       const { email, role } = req.body;
//       try {
//         const user = await User.findOne({ where: { email:email.toLowerCase() } });
    
//         if (!user) {
//           return res.status(404).json({ success: false, message: 'User not found' });
//         }
//         const r = await RP.findOne({where: {role:role.toLowerCase()}});
//         if(!r){
//           return res.status(401).json({success:false, message: 'Please give correct name of role.' });
//         }
//         const roles = user.roles ;
//         const newRoles =[];
//         const Role =role.toLowerCase();
//         const roleIndex = roles.indexOf(Role);
//         if (roleIndex === -1) {
//           return res.status(404).json({ success: false, message: `deleted role '${Role}' not found` });
//         }
//         if(roles.length === 1){
//           return res.status(401).json({ success: false, message: "You already have only one role only. Please update or set a new role." });
//         }
//         const Roles = roles.filter(role => role !== Role);
//         // roles.splice(roleIndex, 1);
//         for (let i = 0; i < Roles.length; i++) {
//           const newRole = Roles[i];
//           newRoles.push(newRole);
//           console.log(newRoles)
//           user.roles = newRoles;
//         }
//         await user.save();
//         if(req.user.email !== undefined){
//           await userActivity(`deleted '${Role}' role from '${user.email}'. `, req.user.email );
//         }
//         res.status(200).json({ success: true, message: 'Role deleted successfully', user: user.roles });
//       } catch (err) {
//         console.log(err);
//         res.status(400).json({ success: false, error: err.message });
//       }
//     };







// exports.showRoles = async (req, res) => {
//       try{
//         const roles = await RP.findAll({attributes: ['role']});
//         res.status(200).json({success: true,roles });
//       }catch(err){
//         console.log('error occured', err);
//         res.status(500).json({success:false, error: err.message})
//       }
//     }



// //set role
//   exports.setRole = async (req, res) => {
//       const { email, newRole } = req.body;
//       try {
//         let user = await User.findOne({ where: { email } });
//         if (!user) {
//           return res.status(404).json({success: false,message: 'User not found',});
//         }
//         const roles = user.roles || [];
//         if (roles.includes(newRole)) {
//           return res.status(400).json({success: false,message: 'Role already set for the user',});
//         }
    
//         roles.push(newRole);
//         user.roles = roles;
//         await user.save();
//         res.status(200).json({success: true,message: 'Role set successfully',user,});
//       } catch (error) {
//         console.error(error);
//         res.status(500).json({success: false, error: error.message,});
//       }
//     };



// //role update
// exports.updateRole = async (req, res, next) => {
//   console.log(req.body);
//   const {email, newRole} = req.body;
//   try {
//       const user = await User.findOne({where: {email}});
//       if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//       }
//       if (newRole && newRole !== req.user.role) {
//           user.role = newRole;
//       }
//       await user.save();
//       res.status(200).json({ 
//           message: 'User role updated successfully',
//           user
//       });
//     } catch (err) {
//       next(err);
//     }
//   };
