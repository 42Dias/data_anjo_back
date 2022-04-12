import { DataTypes } from 'sequelize';import moment from 'moment';

export default function (sequelize) {
  const cerimonia = sequelize.define(
    'cerimonia',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      nomeHomenageado: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        }
      },
      cpf: {
        type: DataTypes.STRING(250),
        allowNull: false,
        validate: {
          // len: [10, 12],
          notEmpty: true,
        }
      },
      dataCerimonia: {
        type: DataTypes.DATEONLY,
        get: function() {
          // @ts-ignore
          return this.getDataValue('dataCerimonia')
            ? moment
                // @ts-ignore
                .utc(this.getDataValue('dataCerimonia'))
                .format('YYYY-MM-DD')
            : null;
        },
        allowNull: false,
      },
      responsavel: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        }
      },
      telefoneResponsavel: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        }
      },
      emailResponsavel: {
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
      isEncerrada: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
        {
          unique: true,
          fields: ['cpf', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
      ],
      timestamps: true,
      paranoid: true,
    },
  );

  cerimonia.associate = (models) => {
    models.cerimonia.belongsTo(models.funeraria, {
      as: 'idFuneraria',
      constraints: false,
    });

    models.cerimonia.hasMany(models.cerimoniaData, {
      constraints: false,
    });


    
    models.cerimonia.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    });

    models.cerimonia.belongsTo(models.user, {
      as: 'createdBy',
    });

    models.cerimonia.belongsTo(models.user, {
      as: 'updatedBy',
    });
  };

  return cerimonia;
}
