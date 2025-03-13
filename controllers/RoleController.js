const Role = require("../modeles/RoleModal");

//create
exports.createRole = (req, res) => {
  const role = new Role({
    permission: req.body.permission,
    nomsousadmin: req.body.nomsousadmin,
  });

  role
    .save()
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      res.status(500).send({
        message: error.message || " server error while creating the role",
      });
    });
};

//getall
exports.findAllRoles = (req, res) => {
  Role.find()
    .then((roles) => {
      res.send(roles);
    })
    .catch((error) => {
      res.status(500).send({
        message: error.message || " server error while retreiving our roles",
      });
    });
};
//getone
exports.findOneRole = (req, res) => {
  Role.findById(req.params.roleId)
    .then((role) => {
      if (!role) {
        return res.status(404).send({
          message: "role not found by id " + req.params.roleId,
        });
      }
      res.send(role);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while retreiving the role by id" + req.params.roleId,
      });
    });
};
//update
exports.updateRole = (req, res) => {
  // validation(optional)
  if (!req.body.title) {
    return res.status(400).send({
      message: "role title connot be empty",
    });
  }
  Role.findByIdAndUpdate(
    req.params.roleId,
    {
      permission: req.body.permission,
      nomsousadmin: req.body.nomsousadmin,
    },
    { new: true }
  )
    .then((role) => {
      if (!role) {
        return res.status(404).send({
          message: "role not fount with the id " + req.params.roleId,
        });
      }
      res.send(role);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while updating the role by id" + req.params.roleId,
      });
    });
};

//delete
exports.deleterole = (req, res) => {
  Role.findByIdAndDelete(req.params.roleId)
    .then((role) => {
      if (!role) {
        return res.status(404).send({
          message: "role not found with ID " + req.params.roleId,
        });
      }
      res.send({ message: "role deleted successfully!" });
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          "Server error while deleting the role with ID " + req.params.roleId,
      });
    });
};
