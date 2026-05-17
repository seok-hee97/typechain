# typechain

TypeScript로 구현한 학습용 블록체인. 작업증명(Proof-of-Work) 채굴, SHA-256 해시 체이닝, 체인 무결성 검증을 포함합니다.

---

## 목차

- [특징](#특징)
- [요구 사항](#요구-사항)
- [설치 및 실행](#설치-및-실행)
- [스크립트](#스크립트)
- [프로젝트 구조](#프로젝트-구조)
- [아키텍처](#아키텍처)
  - [BlockShape 인터페이스](#blockshape-인터페이스)
  - [Block 클래스](#block-클래스)
  - [Blockchain 클래스](#blockchain-클래스)
- [작업증명(Proof-of-Work) 동작 원리](#작업증명proof-of-work-동작-원리)
- [체인 검증](#체인-검증)
- [사용 예시](#사용-예시)
- [출력 예시](#출력-예시)
- [TypeScript 설정](#typescript-설정)
- [향후 학습 트랙](#향후-학습-트랙)
- [Reference](#reference)

---

## 특징

- **불변 블록**: 모든 `Block` 필드가 `readonly`라 외부 변조 불가
- **`private constructor`**: 채굴되지 않은 블록을 직접 생성할 수 없음 (`Block.mine()`만 진입점)
- **작업증명(PoW)**: 난이도만큼의 leading-zero 해시를 찾을 때까지 nonce 증가
- **체인 검증**: prev-hash 링크 + 높이 순서 + 개별 블록 PoW 무결성 일괄 검사
- **재현 가능한 해시**: `prevHash`, `height`, `data`, `timestamp`, `difficulty`, `nonce`가 모두 해시 입력에 포함되어 어느 한 비트만 바뀌어도 무효화

---

## 요구 사항

- Node.js 18 이상
- npm

---

## 설치 및 실행

```bash
git clone https://github.com/seok-hee97/typechain.git
cd typechain
npm install
npm run dev
```

---

## 스크립트

| 명령어            | 설명                                                              |
| ----------------- | ----------------------------------------------------------------- |
| `npm run dev`     | `nodemon`이 `src/index.ts`를 감시하며 `ts-node`로 즉시 실행      |
| `npm run build`   | `tsc`로 TypeScript를 컴파일해 `build/`에 산출                    |
| `npm start`       | 컴파일된 `build/index.js`를 Node로 실행                          |

---

## 프로젝트 구조

```
typechain/
├── .gitignore             # node_modules/, build/, .DS_Store 무시
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json          # strict: true, target ES6, module CommonJS
└── src/
    ├── index.ts           # 블록체인 본체 (Block, Blockchain)
    └── myPackage.js       # JSDoc + @ts-check 데모 (참고용, 미사용)
```

---

## 아키텍처

### BlockShape 인터페이스

블록이 가져야 할 모든 필드를 정의합니다. 전부 `readonly`로 선언되어 인스턴스가 만들어진 뒤에는 변경할 수 없습니다.

```ts
interface BlockShape {
    readonly hash: string;        // 블록 자체의 SHA-256 해시
    readonly prevHash: string;    // 이전 블록의 hash (제네시스 블록은 "")
    readonly height: number;      // 블록 번호 (1부터 시작)
    readonly data: string;        // 블록에 담을 임의 데이터
    readonly timestamp: number;   // 채굴 시각 (epoch ms)
    readonly nonce: number;       // PoW로 찾아낸 값
    readonly difficulty: number;  // 채굴 당시 요구된 leading-zero 개수
}
```

### Block 클래스

블록 생성은 채굴을 통해서만 가능합니다. 생성자가 `private`이라 외부에서 `new Block(...)`을 호출할 수 없습니다.

| 멤버 | 종류 | 설명 |
| --- | --- | --- |
| `Block.calculateHash(prevHash, height, data, timestamp, difficulty, nonce)` | `static` | 6개 필드를 이어붙여 SHA-256 해시를 계산 |
| `Block.mine(prevHash, height, data, difficulty)` | `static` | nonce를 0부터 증가시켜 PoW 조건(`difficulty`개의 leading zero)을 만족하는 해시를 찾을 때까지 반복. 성공한 시점의 `Block` 인스턴스를 반환 |
| `block.isValid()` | 인스턴스 | 저장된 필드로 해시를 재계산해 `hash`와 일치하는지, 그리고 PoW 조건을 충족하는지 확인 |

### Blockchain 클래스

```ts
class Blockchain {
    constructor(difficulty: number = 3)        // 채굴 난이도 지정 (기본 3)
    public  addBlock(data: string): Block       // 새 블록을 채굴해 체인에 추가
    public  getBlocks(): readonly Block[]       // 체인의 얕은 복사본 반환
    public  validateChain(): boolean            // 체인 전체 무결성 검사
    private getPrevHash(): string               // 마지막 블록의 hash (없으면 "")
}
```

`blocks` 배열은 `private`이며, `getBlocks()`는 얕은 복사본을 돌려줍니다. 개별 `Block` 필드도 `readonly`이므로 반환된 배열을 통해 체인을 변조할 수 없습니다.

---

## 작업증명(Proof-of-Work) 동작 원리

`Block.mine()`은 다음을 반복합니다:

1. `nonce = 0`에서 시작해 `calculateHash(...)` 호출
2. 결과 해시가 `"0".repeat(difficulty)`로 시작하면 성공 → 그 시점의 `nonce`, `hash`, `timestamp`를 가진 `Block`을 반환
3. 아니면 `nonce++` 후 다시 해시 계산

```ts
static mine(
    prevHash: string,
    height: number,
    data: string,
    difficulty: number,
): Block {
    const timestamp = Date.now();
    const target = "0".repeat(difficulty);
    let nonce = 0;
    let hash = Block.calculateHash(prevHash, height, data, timestamp, difficulty, nonce);
    while (!hash.startsWith(target)) {
        nonce++;
        hash = Block.calculateHash(prevHash, height, data, timestamp, difficulty, nonce);
    }
    return new Block(prevHash, height, data, difficulty, timestamp, nonce, hash);
}
```

`difficulty`를 1씩 늘릴 때마다 평균 시도 횟수는 약 **16배** 증가합니다 (16진수 한 자리당 1/16 확률).

| difficulty | 예상 평균 시도 | 권장 용도 |
| --- | --- | --- |
| 1 | ~16회 | 데모 |
| 2 | ~256회 | 디버깅 |
| 3 | ~4,096회 | 기본값, 학습 |
| 4 | ~65,536회 | 살짝 무거움 |
| 5+ | 매우 느림 | 권장 안 함 |

---

## 체인 검증

`Blockchain.validateChain()`은 다음을 차례대로 검사합니다.

| 검사 항목 | 통과 조건 |
| --- | --- |
| 이전 해시 링크 | `block.prevHash`가 이전 블록의 `hash`와 일치 (첫 블록은 `""`) |
| 높이 순서 | `block.height === i + 1` |
| 블록 자체 무결성 | `block.isValid()` — 저장된 필드로 재계산한 해시가 `block.hash`와 같고, leading-zero 개수가 `difficulty` 이상 |

하나라도 실패하면 `false`를 반환합니다. 누군가 채굴 후 `data`를 바꿔치기해도 해시가 달라져서 즉시 탐지됩니다.

---

## 사용 예시

`src/index.ts`의 엔트리 코드로 사용 흐름을 그대로 따라 할 수 있습니다.

```ts
import crypto from "crypto";
// ... Block, Blockchain 정의

const blockchain = new Blockchain(3);

blockchain.addBlock("First one");
blockchain.addBlock("Second one");
blockchain.addBlock("Third one");
blockchain.addBlock("Fourth one");

console.log(blockchain.getBlocks());
console.log("Chain valid:", blockchain.validateChain());
```

---

## 출력 예시

```bash
$ npm start

[
  Block {
    prevHash: '',
    height: 1,
    data: 'First one',
    difficulty: 3,
    timestamp: 1778984861496,
    nonce: 168,
    hash: '000f9f6f1278fe3fa2a2d86b225bf6caefedbcd6f2098af5ee9122e2d9b50957'
  },
  Block {
    prevHash: '000f9f6f1278fe3fa2a2d86b225bf6caefedbcd6f2098af5ee9122e2d9b50957',
    height: 2,
    data: 'Second one',
    difficulty: 3,
    timestamp: 1778984861496,
    nonce: 1724,
    hash: '00003e11581cc75394beedc520fc5bbb6e92a46e9b1f838017cd23ca0ba7e5ee'
  },
  ...
]
Chain valid: true
```

모든 `hash`가 `000`(난이도 3)으로 시작하고, 각 블록의 `prevHash`가 직전 블록의 `hash`와 정확히 일치합니다.

---

## TypeScript 설정

`tsconfig.json`의 핵심 옵션:

| 옵션 | 값 | 의미 |
| --- | --- | --- |
| `strict` | `true` | 엄격 모드 (모든 strict 옵션 활성화) |
| `target` | `ES6` | ES2015 문법으로 컴파일 |
| `module` | `CommonJS` | Node 기본 모듈 시스템 사용 |
| `lib` | `["ES6"]` | ES6 표준 라이브러리만 사용 |
| `esModuleInterop` | `true` | `import crypto from "crypto"` 형태 지원 |
| `outDir` | `build` | 컴파일 산출물 위치 |
| `include` | `["src"]` | `src/` 디렉터리만 컴파일 대상 |

---

## 향후 학습 트랙

1. **단위 테스트 추가** — Vitest 등으로 `validateChain()`, 변조 탐지, PoW 동작을 검증
2. **트랜잭션 도입** — `data: string`을 `Transaction[]`으로 확장
3. **머클 트리** — 트랜잭션을 한 해시로 압축
4. **지갑과 서명** — `crypto.generateKeyPairSync` + ECDSA 서명 검증
5. **P2P 동기화** — `ws` 라이브러리로 노드 간 체인 동기화 및 컨센서스
6. **난이도 자동 조정** — 채굴 시간에 따라 `difficulty`를 동적으로 조정

---

## Reference

- [Nomad Coders — TypeScript로 블록체인 만들기](https://nomadcoders.co/)
