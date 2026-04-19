// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProductExpiry {
    struct Product {
        uint256 productId;
        string name;
        string category;
        string manufactureDate;
        string expiryDate;
        address manufacturer;
        bool isActive;
    }

    mapping(uint256 => Product) public products;

    // NEW: store all product IDs
    uint256[] public productIds;
    uint256 public nextProductId = 1;

    // -----------------------------------------
    // ADD PRODUCT
    // -----------------------------------------
    function addProduct(
        string memory _name,
        string memory _category,
        string memory _manufactureDate,
        string memory _expiryDate
    ) public returns (uint256) {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_expiryDate).length > 0, "Expiry required");

        uint256 newId = nextProductId;
        
        products[newId] = Product(
            newId,
            _name,
            _category,
            _manufactureDate,
            _expiryDate,
            msg.sender,
            true
        );

        productIds.push(newId);
        nextProductId++;  // Increment for next product

        return newId; // Return the generated ID
    }

    // -----------------------------------------
    // NEW: RETURN ALL PRODUCT IDS
    // -----------------------------------------
    function getAllProducts() public view returns (uint256[] memory) {
        return productIds;
    }
  
    // -----------------------------------------
    // NEW: DELETE (DEACTIVATE) PRODUCT
    // -----------------------------------------
    function deleteProduct(uint256 _productId) public {
        require(products[_productId].isActive, "Product not found");

        // Only manufacturer can delete
        require(products[_productId].manufacturer == msg.sender, "Not authorized");

        products[_productId].isActive = false;
    }

    // -----------------------------------------
    // VERIFY PRODUCT
    // -----------------------------------------
    function verifyProduct(uint256 _productId)
        public
        view
        returns (string memory status, int256 daysLeft)
    {
        Product memory p = products[_productId];

        if (!p.isActive) {
            return ("Product not found", 0);
        }

        (bool ok, int256 diff) = diffDays(p.expiryDate);
        if (!ok) return ("Invalid expiry format", 0);

        if (diff < 0) {
            return ("Product expired", diff);
        } else {
            return ("Product valid", diff);
        }
    }

    // -----------------------------------------
    // DATE FUNCTIONS
    // -----------------------------------------
    function diffDays(string memory date)
        internal
        view
        returns (bool, int256)
    {
        bytes memory d = bytes(date);
        if (d.length != 10) return (false, 0);

        int256 yyyy = toInt(d[0], d[1], d[2], d[3]);
        int256 mm = toInt(d[5], d[6]);
        int256 dd = toInt(d[8], d[9]);

        if (yyyy <= 0 || mm <= 0 || dd <= 0) return (false, 0);

        int256 exp = daysFromDate(yyyy, mm, dd);
        int256 today = daysFromTimestamp(block.timestamp);

        return (true, exp - today);
    }

    function toInt(bytes1 a, bytes1 b, bytes1 c, bytes1 d)
        internal
        pure
        returns (int256)
    {
        return
            int256(int8(uint8(a)) - 48) * 1000 +
            int256(int8(uint8(b)) - 48) * 100 +
            int256(int8(uint8(c)) - 48) * 10 +
            int256(int8(uint8(d)) - 48);
    }

    function toInt(bytes1 a, bytes1 b)
        internal
        pure
        returns (int256)
    {
        return
            (int8(uint8(a)) - 48) * 10 +
            (int8(uint8(b)) - 48);
    }

    function daysFromTimestamp(uint256 ts) internal pure returns (int256) {
        return int256(ts / 86400);
    }

    function daysFromDate(int256 y, int256 m, int256 d)
        internal
        pure
        returns (int256)
    {
        if (m < 3) {
            y -= 1;
            m += 12;
        }
        int256 era = y / 400;
        int256 yoe = y - era * 400;
        int256 doy = (153 * (m - 3) + 2) / 5 + d - 1;
        int256 doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
        return era * 146097 + doe - 719468;
    }


function getExpiryTimestamp(uint256 _productId) public view returns (uint256) {
    Product memory p = products[_productId];
    bytes memory d = bytes(p.expiryDate);

    int256 yyyy = toInt(d[0], d[1], d[2], d[3]);
    int256 mm = toInt(d[5], d[6]);
    int256 dd = toInt(d[8], d[9]);

    int256 daysValue = daysFromDate(yyyy, mm, dd);
    return uint256(daysValue * 86400);
}
}
