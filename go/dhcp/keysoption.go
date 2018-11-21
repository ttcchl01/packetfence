package main

import (
	"database/sql"

	"github.com/inverse-inc/packetfence/go/log"
)

func MysqlInsert(key string, value string, db *sql.DB) bool {
	rows, err := db.Query("replace into key_value_storage values(?,?)", "/dhcpd/"+key, value)
	defer rows.Close()
	if err != nil {
		log.LoggerWContext(ctx).Error("Error while inserting into MySQL: " + err.Error())
		return false
	} else {
		return true
	}
}

func MysqlGet(key string, db *sql.DB) (string, string) {
	rows, err := db.Query("select id, value from key_value_storage where id = ?", "/dhcpd/"+key)
	defer rows.Close()
	if err != nil {
		log.LoggerWContext(ctx).Debug("Error while getting MySQL '" + key + "': " + err.Error())
		return "", ""
	}
	var (
		Id    string
		Value string
	)
	for rows.Next() {
		err := rows.Scan(&Id, &Value)
		if err != nil {
			log.LoggerWContext(ctx).Crit(err.Error())
		}
	}

	return Id, Value
}

func MysqlDel(key string, db *sql.DB) bool {
	rows, err := db.Query("delete from key_value_storage where id = ?", "/dhcpd/"+key)
	defer rows.Close()
	if err != nil {
		log.LoggerWContext(ctx).Error("Error while deleting MySQL key '" + key + "': " + err.Error())
		return false
	}
	return true
}
