// 국가유산청의 Open API를 사용하여 검색하는 코드드

import { json } from '@sveltejs/kit';
import type {
	Category,
	CcbaItemResponse,
	CcbaItemImageResponse,
	SearchedCcbaItem
} from '$/lib/searchTypes';

const CCBA_API_URL: string = 'http://www.khs.go.kr/cha/SearchKindOpenapiList.do';
const CCBA_IMAGE_API_URL: string = 'http://www.khs.go.kr/cha/SearchImageOpenapi.do';

// 아이템 목록을 검색하는 함수
// ccbaFilter는 server.ts에서 국가유산 종목만 필터링된 Category 배열
export async function ccbaItemSearch(
	ccbaFilter: Category,
	Keyword: string
): Promise<SearchedCcbaItem[]> {
	const ccbaKdcd: Category[] = ccbaFilter.item.filter((cat) => cat.code === 'ccbaKdcd')[0].item;
	const ccbaCtcd: Category[] = ccbaFilter.item.filter((cat) => cat.code === 'ccbaCtcd')[0].item;
	const ccbaPcd1: Category[] = ccbaFilter.item.filter((cat) => cat.code === 'ccbaPcd1')[0].item;

	let result: SearchedCcbaItem[] = [];

	// 상위 함수에서 try-catch로 에러를 처리
	// API query에 한 항목을 여러 개 요청 할 수 없으므로, map을 사용하여 해당 동작을 하도록 구현
	ccbaKdcd.map((kdcd) => {
		ccbaCtcd.map((ctcd) => {
			ccbaPcd1.map(async (pcd1) => {
				await fetch(
					`${CCBA_API_URL}?ccbaKdcd=${kdcd.code}&ccbaCtcd=${ctcd.code}&ccbaPcd1=${pcd1.code}${
						Keyword ? `&ccbaMnm1=${encodeURIComponent(Keyword)}` : ''
					}`
				).then(async (response) => {
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					const xml = await response.text();
					const ccbaItems: SearchedCcbaItem[] = await getCCbaItems(xml);
					result = result.concat(ccbaItems);
				});
			});
		});
	});

	// 중복 있으면 제거
	result = result.filter(
		(item, index, self) =>
			index === self.findIndex((t) => t.ccbaAsno === item.ccbaAsno && t.ccbaKdcd === item.ccbaKdcd)
	);

	// Keyword가 있는 경우, 결과를 필터링
	if (Keyword) {
		result = result.filter((item) => item.ccbaMnm1.toLowerCase().includes(Keyword.toLowerCase()));
	}

	return result;
}

async function getCCbaItems(responseXML: string): Promise<SearchedCcbaItem[]> {
	const ccbaItems = parseXMLToCcbaItemResponse(responseXML);
	let result: SearchedCcbaItem[] = [];
	ccbaItems.forEach(async (item) => {
		await fetch(
			`${CCBA_IMAGE_API_URL}?ccbaKdcd=${item.ccbaKdcd}&ccbaAsno=${item.ccbaAsno}&ccbaCtcd=${item.ccbaCtcd}`
		).then(async (response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const xml = await response.text();
			const image: CcbaItemImageResponse = parseXMLToCcbaItemImageResponse(xml);
			const searchedItem: SearchedCcbaItem = {
				no: item.no,
				ccmaName: item.ccmaName,
				ccbaMnm1: item.ccbaMnm1,
				ccbaCtcdNm: item.ccbaCtcdNm,
				ccbaAdmin: item.ccbaAdmin,
				ccbaKdcd: item.ccbaKdcd,
				ccbaAsno: item.ccbaAsno,
				ccbaCtcd: item.ccbaCtcd,
				imageUrl: image.imageUrl,
				ccimDesc: image.ccimDesc
			};
			result.push(searchedItem);
		});
	});
	return result;
}

function parseXMLToCcbaItemResponse(xml: string): CcbaItemResponse[] {
	// XML 파싱 로직을 구현합니다.
	const parser: DOMParser = new DOMParser();
	const doc: Document = parser.parseFromString(xml, 'text/xml');
	const items: NodeListOf<Element> = doc.querySelectorAll('item');
	const results: CcbaItemResponse[] = [];
	items.forEach((item) => {
		const ccbaItem: CcbaItemResponse = {
			sn: parseInt(item.querySelector('sn')?.textContent || '0', 10),
			no: parseInt(item.querySelector('no')?.textContent || '0', 10),
			ccmaName: item.querySelector('ccmaName')?.textContent || '',
			ccbaMnm1: item.querySelector('ccbaMnm1')?.textContent || '',
			ccbaMnm2: item.querySelector('ccbaMnm2')?.textContent || '',
			ccbaCtcdNm: item.querySelector('ccbaCtcdNm')?.textContent || '',
			ccsiName: item.querySelector('ccsiName')?.textContent || '',
			ccbaAdmin: item.querySelector('ccbaAdmin')?.textContent || '',
			ccbaKdcd: item.querySelector('ccbaKdcd')?.textContent || '',
			ccbaCtcd: item.querySelector('ccbaCtcd')?.textContent || '',
			ccbaAsno: item.querySelector('ccbaAsno')?.textContent || '',
			ccbaCncl: item.querySelector('ccbaCncl')?.textContent || '',
			ccbaCpno: item.querySelector('ccbaCpno')?.textContent || '',
			longitude: item.querySelector('longitude')?.textContent || '',
			latitude: item.querySelector('latitude')?.textContent || '',
			regDt: item.querySelector('regDt')?.textContent || ''
		};
		results.push(ccbaItem);
	});
	return results;
}

function parseXMLToCcbaItemImageResponse(xml: string): CcbaItemImageResponse {
	// XML 파싱 로직을 구현합니다.
	const parser: DOMParser = new DOMParser();
	const doc: Document = parser.parseFromString(xml, 'text/xml');
	const item: Element | null = doc.querySelector('item');

	if (!item) {
		return {
			ccbaKdcd: '',
			ccbaAsno: '',
			ccbaCtcd: '',
			ccbaMnm1: '',
			ccbaMnm2: '',
			sn: 0,
			imageNuri: '',
			imageUrl: '',
			ccimDesc: ''
		};
	}

	const results: CcbaItemImageResponse = {
		ccbaKdcd: item.querySelector('ccbaKdcd')?.textContent || '',
		ccbaAsno: item.querySelector('ccbaAsno')?.textContent || '',
		ccbaCtcd: item.querySelector('ccbaCtcd')?.textContent || '',
		ccbaMnm1: item.querySelector('ccbaMnm1')?.textContent || '',
		ccbaMnm2: item.querySelector('ccbaMnm2')?.textContent || '',
		sn: parseInt(item.querySelectorAll('sn')[0]?.textContent || '1', 10),
		imageNuri: item.querySelectorAll('imageNuri')[0]?.textContent || '',
		imageUrl: item.querySelectorAll('imageUrl')[0]?.textContent || '',
		ccimDesc: item.querySelectorAll('ccimDesc')[0]?.textContent || ''
	};
	return results;
}
