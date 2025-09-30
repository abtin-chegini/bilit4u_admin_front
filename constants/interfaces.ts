export interface SrvRequestBody {
	sCityCode: string;
	dCityCode: string;
	// pageNumber: number;
	sDate: string;
	reqtime: string;
	// Sort_by: string;
	// PageSize: number;
	// CoGroup: string;
}

export interface SrvRequestRes {
	Services: SrvRequestResItem[];
	TotalPages: number;
	CurrentPage: number;
	AllItems: number;
}
export interface SeatIconProps {

	state: "default" | "reserved-male" | "reserved-female" | "selected-male" | "selected-female";
}
export interface SrvRequestResItem {
	LogoUrl: string;
	IsCharger: boolean;
	IsMonitor: boolean;
	IsBed: boolean;
	Token: string;
	CoName: string;
	CoGroup: string;
	ServiceNo: string;
	DepartDate: string;
	DepartTime: string;
	BusType: string;
	SrcCityName: string;
	SrcCityId: string;
	DesCityName: string;
	DesCityId: string;
	Cnt: string;
	Price: string;
	FullPrice: string;
	Description: string;
	FinalDesCityId: string;
	FinalDesCityName: string;
	OtherDestinations: Destination[];
	Commision: string;
	SiteIdCode: string;
}

export interface Destination {
	Id: string;
	name: string;
}

export interface Company {
	id: string;
	name: string;
	englishName: string;
	logoUrl?: string;
	description?: string;
}
