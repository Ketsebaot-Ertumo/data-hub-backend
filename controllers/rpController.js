const {sequelize} = require('../models/index')
const DataTypes = require('sequelize');
const userActivity = require('../utilis/userActivity');
const RP = require('../models/rpModel')(sequelize, DataTypes);





//to create and update docType,role,and permissions
exports.rolePermission = async (req, res) => {
  const {docType,Role,permissions} =req.body;
  try{
  let updated;
  if(!Role || !docType){
    return res.status(402).json({success:false,message:'Please provide Role or docType or Permissions'})
  }
     const role=Role.toLowerCase()
     const existing = await RP.findOne({ where: { role } });
 
     const filter = permissions.filter((permission, index, arr) => {
       const firstIndex = arr.findIndex(p => p.permission === permission.permission);
       return firstIndex === index; // Keep the first occurrence, remove all subsequent occurrences
     });console.log('permissions',permissions)
     console.log('existing-before',existing.permissions,'permissions',permissions,'filter',filter,)
     if(existing){
       if(role !== 'admin'){
        const updatedPermissions = [...existing.permissions];

        filter.forEach(updatedPermission => {
          const existingPermissionIndex = updatedPermissions.findIndex(permission => permission.permission === updatedPermission.permission);
          if (existingPermissionIndex !== -1) {
            updatedPermissions[existingPermissionIndex] = updatedPermission;
          } else {
            updatedPermissions.push(updatedPermission);
          }
        });
           existing.permissions = updatedPermissions;
        //  console.log('existing',existing.permissions); //save existing
       }else {
         const updatedPermissions = existing.permissions.filter(permission => {
           return !filter.some(updatedPermission => updatedPermission.permission === permission.permission);
         });
         const data = updatedPermissions.concat(filter.map(updatedPermission => {
           return { ...updatedPermission, granted: "true" };
         }));
        //  console.log('data',data) 
         existing.permissions=data //save existing
         }
         existing.docType=docType;
         await existing.save();
         res.status(200).json({success:true,message:'Successfully updated.',data:existing})
       }else{
         if(role === 'admin'){
           const data = filter.map(permission => {
             return { ...permission, granted: true };
           });
           allTruePermissions= [ {permission:"read",granted: true}, {permission:"write" ,granted: true}, {permission:"edit" ,granted: true}, {permission:"delete" ,granted: true},{permission:"download",granted: true}, {permission:"import",granted: true},{permission:"cut",granted: true},{permission:"copy",granted: true} ];
           const mergedPermissions = [...allTruePermissions];

           data.forEach(updatedPermission => {
             const existingPermissionIndex = mergedPermissions.findIndex(permission => permission.permission === updatedPermission.permission);
             if (existingPermissionIndex !== -1) {
               mergedPermissions[existingPermissionIndex] = updatedPermission;
             } else {
               mergedPermissions.push(updatedPermission);
             }
           });
          //  console.log('merged',mergedPermissions); //save this
           updated = await RP.create({docType, role,permissions: mergedPermissions });
         }else{
           const defaultValue= [ {permission: "read",granted:false}, {permission:"write",granted:false}, {permission:"edit",granted:false}, {permission:"delete",granted:false},{permission:"download",granted:false}, {permission:"import",granted:false},{permission:"cut",granted: false},{permission:"copy",granted: false} ];
           // const mergedPermissions = [];

           const mergedPermissions = [...defaultValue];

           filter.forEach(permission => {
             const { permission: permissionName, granted } = permission;

             const existingPermissionIndex = mergedPermissions.findIndex(p => p.permission === permissionName);

             if (existingPermissionIndex !== -1) {
               // Update the "granted" value if the permission already exists
               mergedPermissions[existingPermissionIndex].granted = granted === 'true';
             } else {
               // Add the permission to the "merged" list if it doesn't exist
               mergedPermissions.push({ permission: permissionName, granted: granted === 'true' });
             }
           });
           console.log('filter',filter,'merged',mergedPermissions);
           updated = await RP.create({docType, role,permissions: mergedPermissions });
         }
         // updated = await RP.create({docType, role,permissions: mergedPermissions });
         await updated.save();
         res.status(201).json({success:true,message:'Successfully created.',data:updated})
       }
       if(req.user.email !== undefined){
          await userActivity(`set docType,role, and permissions. `, req.user.email );
        }
    }catch(err){
       console.log(err)
       res.status(500).json({success:false,error:err.message})
     }
}






// exports.rolePermission = async (req, res) => {
//       const { docType,Role, permissions } = req.body;
//       try {
//         if(!Role || !docType){
//           res.status(402).json({success:false,message:'Please provide Role or docType or Permissions'})
//         }else{
//         let perm;const new1=[] 
//         const role=Role.toLowerCase()
//         // if(docType !== "Sales Data" && docType !== "User Data" && docType !== "Customer Data" && docType !== "Organization Data" && docType !== "Product Data" && docType !== "Branch Data" && docType !== "All Data"){
//         //   res.status(402).json({success:false,message:'Please provide Correct docType name.'})
//         // }
//         // else if(role !== "admin" && role !== "user" && role !== "sales" && role !== "organ" && role !== "product" && role !== "branch" && role !== "customer"){
//         //   res.status(402).json({success:false,message:'Please provide Correct role name.'})
//         // }
//         // else{
//         const existingRole = await RP.findOne({ where: { role } });
//         if (existingRole) {
//           if (role !== 'admin') {
//             const isSame = permissions.every((existingPermission, index) => {
//               const newPermission = permissions[index];
//               const newE = existingRole.permissions[index]
//               console.log(newPermission, newE, existingPermission)
//               return existingPermission.permission === newE.permission && newPermission.granted === newE.granted && existingRole.docType === docType;
//             });
//             console.log(isSame)
//             if (!isSame) {
//                 // await existingRole.update({ permissions });
//                 for (let i = 0; i < permissions.length; i++) {
//                     const  permission = permissions[i];
//                     const Roles = existingRole.permissions.map(value => value.permission.includes(permission.permission) ? permission : value);
//                     console.log(Roles)
//                     existingRole.permissions = Roles;
//                   }
//                   existingRole.docType = docType;
//                 await existingRole.save();
//                 // await userActivity(`update permissions for '${roles}' role. `, req.user.email );
//                 return res.status(200).json({success:true,message:'Permissions updated.',existingRole})
//                 // }
//             }
//             else{
//               return res.status(303).json({message: 'Have no updates.',data:existingRole, permissions})}
//           }
//         } else {
//           if (role === 'admin') {
//             // const allTruePermissions = permissions.map(permission => ({ ...permission, [Object.keys(permission)[0]]: true }));
//             allTruePermissions= [ {permission:"read",granted: true}, {permission:"write" ,granted: true}, {permission:"edit" ,granted: true}, {permission:"delete" ,granted: true},{permission:"download",granted: true}, {permission:"import",granted: true},{permission:"cut",granted: true},{permission:"copy",granted: true} ];
//             perm=await RP.create({docType, role, permissions: allTruePermissions });
//           } else {
//             // perm = await RP.create({docType, role, permissions }); //to create only with specified permissions only

//             // Create role with the provided permissions with making other to false
//             if(!permissions){
//                 perm = await RP.create({docType, role, permissions });
//             }
//             else{
//             for (let i = 0; i < permissions.length; i++) {
//                 const  permission = permissions[i];
//                 const defaultValue= [ {permission: "read",granted:false}, {permission:"write",granted:false}, {permission:"edit",granted:false}, {permission:"delete",granted:false},{permission:"download",granted:false}, {permission:"import",granted:false},{permission:"cut",granted: false},{permission:"copy",granted: false} ];
//                 // const Roles = defaultValue.map(value => !value.permission.includes(permission.permission) ? value : permission);
//                 const Roles = defaultValue.map(value =>value.permission !== permission.permission ? value : permission);
//                 perm = await RP.create({docType, role,permissions: Roles });
//             }}
//           }
//         }
//         await perm.save();
//         if(req.user.email !== undefined){
//           await userActivity(`set permissions for '${role}' role. `, req.user.email );
//         }
//         res.status(200).send({success:true,message:'Role permissions created.',data:perm });
//       // }
//       }
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).json({success:false,message:'Server error',error:error.message})
//       }
//     };


