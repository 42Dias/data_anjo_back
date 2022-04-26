import { DataTypes } from 'sequelize';import moment from 'moment';

export default function (sequelize) {
  const cerimoniaData = sequelize.define(
    'cerimoniaData',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      nome: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        }
      },
      email: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      telefone: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        }
      },
      importHash: {
        type: DataTypes.STRING(255),
        allowNull: true,    
        validate: {
          len: [0, 255],
        },    
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['importHash', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
      ],
      timestamps: true,
      paranoid: true,
    },
  );

  cerimoniaData.associate = (models) => {

    models.cerimoniaData.belongsTo(models.funeraria, {
      as: 'idFuneraria',
      constraints: false,
    });


    models.cerimoniaData.belongsTo(models.cerimonia, {
      constraints: false,
      as: 'cerimonia'
    });

    
    models.cerimoniaData.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    });

    models.cerimoniaData.belongsTo(models.user, {
      as: 'createdBy',
    });

    models.cerimoniaData.belongsTo(models.user, {
      as: 'updatedBy',
    });
  };

  return cerimoniaData;
}
