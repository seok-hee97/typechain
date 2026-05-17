import crypto from "crypto";

interface BlockShape {
    readonly hash: string;
    readonly prevHash: string;
    readonly height: number;
    readonly data: string;
    readonly timestamp: number;
    readonly nonce: number;
    readonly difficulty: number;
}

class Block implements BlockShape {
    public readonly hash: string;
    public readonly timestamp: number;
    public readonly nonce: number;

    private constructor(
        public readonly prevHash: string,
        public readonly height: number,
        public readonly data: string,
        public readonly difficulty: number,
        timestamp: number,
        nonce: number,
        hash: string,
    ) {
        this.timestamp = timestamp;
        this.nonce = nonce;
        this.hash = hash;
    }

    static calculateHash(
        prevHash: string,
        height: number,
        data: string,
        timestamp: number,
        difficulty: number,
        nonce: number,
    ): string {
        const toHash = `${prevHash}${height}${data}${timestamp}${difficulty}${nonce}`;
        return crypto.createHash("sha256").update(toHash).digest("hex");
    }

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

    isValid(): boolean {
        const expected = Block.calculateHash(
            this.prevHash,
            this.height,
            this.data,
            this.timestamp,
            this.difficulty,
            this.nonce,
        );
        if (expected !== this.hash) return false;
        return this.hash.startsWith("0".repeat(this.difficulty));
    }
}

class Blockchain {
    private blocks: Block[];
    private readonly difficulty: number;

    constructor(difficulty: number = 3) {
        this.blocks = [];
        this.difficulty = difficulty;
    }

    private getPrevHash(): string {
        if (this.blocks.length === 0) return "";
        return this.blocks[this.blocks.length - 1].hash;
    }

    public addBlock(data: string): Block {
        const newBlock = Block.mine(
            this.getPrevHash(),
            this.blocks.length + 1,
            data,
            this.difficulty,
        );
        this.blocks.push(newBlock);
        return newBlock;
    }

    public getBlocks(): readonly Block[] {
        return [...this.blocks];
    }

    public validateChain(): boolean {
        for (let i = 0; i < this.blocks.length; i++) {
            const block = this.blocks[i];
            const expectedPrevHash = i === 0 ? "" : this.blocks[i - 1].hash;
            if (block.prevHash !== expectedPrevHash) return false;
            if (block.height !== i + 1) return false;
            if (!block.isValid()) return false;
        }
        return true;
    }
}

const blockchain = new Blockchain(3);

blockchain.addBlock("First one");
blockchain.addBlock("Second one");
blockchain.addBlock("Third one");
blockchain.addBlock("Fourth one");

console.log(blockchain.getBlocks());
console.log("Chain valid:", blockchain.validateChain());
