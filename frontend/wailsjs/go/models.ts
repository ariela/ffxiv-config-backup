export namespace backup {
	
	export class BackupMeta {
	    backup_id: string;
	    // Go type: time
	    created_at: any;
	    name: string;
	    memo: string;
	    contains_common_macro: boolean;
	    characters: string[];
	
	    static createFrom(source: any = {}) {
	        return new BackupMeta(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.backup_id = source["backup_id"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.name = source["name"];
	        this.memo = source["memo"];
	        this.contains_common_macro = source["contains_common_macro"];
	        this.characters = source["characters"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Character {
	    id: string;
	    displayName: string;
	    initials: string;
	    isAccount: boolean;
	    isUnknown: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Character(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.displayName = source["displayName"];
	        this.initials = source["initials"];
	        this.isAccount = source["isAccount"];
	        this.isUnknown = source["isUnknown"];
	    }
	}

}

export namespace config {
	
	export class LocalConfig {
	    backup_target_directory: string;
	
	    static createFrom(source: any = {}) {
	        return new LocalConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.backup_target_directory = source["backup_target_directory"];
	    }
	}
	export class SharedConfig {
	    game_data_path: string;
	    character_mappings: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new SharedConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.game_data_path = source["game_data_path"];
	        this.character_mappings = source["character_mappings"];
	    }
	}

}

